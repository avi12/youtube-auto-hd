/**
 * The dev server's half of the conversation with the running Chrome, over the DevTools
 * Protocol port web-ext.config.ts launches it with (CHROME_PORT, 9226 by default).
 *
 * Reloading is split in two because the two kinds of output fail differently. A content
 * script only reaches a page at injection time, so a rebuilt one needs its tab navigated -
 * nothing else re-runs it. An HTML entrypoint (the popup, which is also the options page) is
 * served from disk on every open, so only the pages that happen to be open right now need a
 * nudge, and reloading the whole extension for them would needlessly kill every content
 * script context.
 */

const CDP_HOST = "127.0.0.1";
// Every page the extension has content scripts for: youtube.com and the nocookie embed domain
// from the manifest, plus the local embed harness web-ext.config.ts serves in `iframe` mode -
// its YouTube iframe is a child frame, so navigating the top page re-injects into both.
const RELOADABLE_PAGE_PATTERN = /youtube\.com|youtube-nocookie\.com|localhost:\d+/;

type CdpTarget = {
  type?: string;
  url?: string;
  webSocketDebuggerUrl?: string;
};

type CdpFrame = {
  id: string;
  url: string;
};

type CdpFrameTree = {
  frame: CdpFrame;
  childFrames?: CdpFrameTree[];
};

async function fetchCdpTargets(cdpPort: number) {
  try {
    const response = await fetch(`http://${CDP_HOST}:${cdpPort}/json`);
    const targets: CdpTarget[] = await response.json();
    return targets;
  } catch {
    // The browser is starting, closing, or gone - the caller treats "no targets" as "nothing
    // to reload", which is the right answer in all three cases.
    return [];
  }
}

// Every CDP call here is best-effort: a tab that closes mid-reload drops the socket, and that
// must never reject into the watch loop. Each path resolves on error and close alike.
function evaluateOverCdp(websocketUrl: string, expression: string) {
  return new Promise<void>(resolvePromise => {
    const websocket = new WebSocket(websocketUrl);
    websocket.onopen = () =>
      websocket.send(
        JSON.stringify({
          id: 1,
          method: "Runtime.evaluate",
          params: {
            expression
          }
        })
      );
    websocket.onmessage = event => {
      const message: { id?: number } = JSON.parse(String(event.data));
      if (message.id === 1) {
        websocket.close();
        resolvePromise();
      }
    };
    websocket.onerror = () => resolvePromise();
    websocket.onclose = () => resolvePromise();
  });
}

function findReloadablePageTargets(targets: CdpTarget[]) {
  return targets.filter(target =>
    target.type === "page" &&
    target.url &&
    RELOADABLE_PAGE_PATTERN.test(target.url) &&
    target.webSocketDebuggerUrl);
}

function collectFrames(frameTree?: CdpFrameTree): CdpFrame[] {
  if (!frameTree) {
    return [];
  }

  const frames = [frameTree.frame];
  for (const childFrame of frameTree.childFrames ?? []) {
    frames.push(...collectFrames(childFrame));
  }

  return frames;
}

/**
 * Navigate every open page the extension injects into, so the rebuilt content scripts run.
 * This is the content-script "reload": Chrome offers no way to re-inject into a live document,
 * so the document is replaced instead.
 */
export async function reloadContentScriptPages(cdpPort: number) {
  const targets = await fetchCdpTargets(cdpPort);
  const pages = findReloadablePageTargets(targets);
  await Promise.all(pages.map(page => evaluateOverCdp(page.webSocketDebuggerUrl!, "location.reload()")));
  return pages.length;
}

// An extension page opened as an iframe inside a tab is not a top-level CDP target, so
// location.reload() cannot reach it. Find the frame by entrypoint name and navigate it in place.
function reloadExtensionFrameInTab({ websocketUrl, entrypointName }: {
  websocketUrl: string;
  entrypointName: string;
}) {
  return new Promise<void>(resolvePromise => {
    const websocket = new WebSocket(websocketUrl);
    websocket.onopen = () =>
      websocket.send(
        JSON.stringify({
          id: 1,
          method: "Page.getFrameTree"
        })
      );
    websocket.onmessage = event => {
      const message: {
        id?: number;
        result?: { frameTree?: CdpFrameTree };
      } = JSON.parse(String(event.data));
      if (message.id === 2) {
        websocket.close();
        resolvePromise();
        return;
      }

      if (message.id !== 1) {
        return;
      }

      const frameFound = collectFrames(message.result?.frameTree)
        .find(frame => frame.url.includes(`/${entrypointName}.html`));
      if (!frameFound?.id) {
        websocket.close();
        resolvePromise();
        return;
      }

      websocket.send(
        JSON.stringify({
          id: 2,
          method: "Page.navigate",
          params: {
            url: frameFound.url,
            frameId: frameFound.id
          }
        })
      );
    };
    websocket.onerror = () => resolvePromise();
    websocket.onclose = () => resolvePromise();
  });
}

/**
 * Refresh the open pages of one HTML entrypoint without reloading the extension, so every
 * content script keeps its context. A page that is not open needs nothing: Chrome serves
 * unpacked extension pages from disk, so the next open already gets the new build.
 */
export async function reloadOpenExtensionPages({ entrypointName, cdpPort }: {
  entrypointName: string;
  cdpPort: number;
}) {
  const targets = await fetchCdpTargets(cdpPort);

  const pages = targets.filter(target =>
    target.url?.includes(`/${entrypointName}.html`) &&
    target.webSocketDebuggerUrl);
  if (pages.length) {
    await Promise.all(pages.map(page => evaluateOverCdp(page.webSocketDebuggerUrl!, "location.reload()")));
    return pages.length;
  }

  // Not a top-level page - it may be iframed into one of the content-script pages.
  const hostPages = findReloadablePageTargets(targets);
  await Promise.all(
    hostPages.map(page => reloadExtensionFrameInTab({
      websocketUrl: page.webSocketDebuggerUrl!,
      entrypointName
    }))
  );
  return 0;
}

/**
 * Whether the browser still answers on its debug port. web-ext's own "browser closed" callback
 * is unreliable on Windows - the process it watches can outlive the closed window - so the dev
 * server polls this instead and shuts down when the answer stops coming.
 */
export async function getIsBrowserAlive(cdpPort: number) {
  try {
    const response = await fetch(`http://${CDP_HOST}:${cdpPort}/json/version`);
    return response.ok;
  } catch {
    return false;
  }
}
