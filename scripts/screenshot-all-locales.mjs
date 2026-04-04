import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { execSync, spawn } from "child_process";

const CDP_HOST = "http://localhost:9226";
const EXT_ID = "ppocahclaifdmabkmkehmennokbkhcpo";
const POPUP_URL = `chrome-extension://${EXT_ID}/popup.html`;
const OUT_DIR = "C:/repositories/avi/youtube-auto-hd/screenshots";
const PACKAGE_JSON = "C:/repositories/avi/youtube-auto-hd/package.json";

async function getPages() {
  const response = await fetch(`${CDP_HOST}/json/list`);
  return response.json();
}

async function cdpEval(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () =>
      ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } }))
    );
    ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id === 1) { ws.close(); resolve(message.result?.result?.value); }
    });
  });
}

async function cdpScreenshot(wsUrl, clipY) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () =>
      ws.send(JSON.stringify({ id: 1, method: "Page.captureScreenshot", params: {
        format: "png",
        clip: { x: 0, y: clipY, width: 1280, height: 800, scale: 1 }
      }}))
    );
    ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id === 1) { ws.close(); resolve(message.result?.data); }
    });
  });
}

async function cdpCommand(wsUrl, method, params = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () => ws.send(JSON.stringify({ id: 1, method, params })));
    ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id === 1) { ws.close(); resolve(message.result); }
    });
  });
}

async function waitForChrome(timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(`${CDP_HOST}/json/version`);
      if (response.ok) return;
    } catch { /* not ready yet */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("Chrome did not start");
}

async function waitForPopup(timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const pages = await getPages();
    const popup = pages.find(page => page.url === POPUP_URL && page.type === "page");
    if (popup) return popup;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error("Popup page not found");
}

async function killChrome() {
  try {
    // Only kill the Chrome process listening on port 9226 (our dev instance)
    const netstatOutput = execSync("cmd /c netstat -ano | findstr :9226", { encoding: "utf-8" });
    const pidMatch = netstatOutput.match(/LISTENING\s+(\d+)/);
    if (pidMatch) {
      execSync(`cmd /c taskkill /F /PID ${pidMatch[1]} /T 2>nul`);
    }
  } catch { /* already dead or not found */ }
  await new Promise(resolve => setTimeout(resolve, 1000));
}

function setLang(locale) {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf-8"));
  pkg.scripts["dev:screenshot"] = `bunx cross-env BLANK=1 LANG=${locale} bun dev`;
  writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n");
}

async function takeScreenshotsForLocale(locale) {
  console.log(`\n=== ${locale} ===`);

  await killChrome();
  setLang(locale);

  // Start WXT dev server — keep stdin open so WXT stays alive to serve popup JS
  const devProcess = spawn("bun", ["dev:screenshot"], {
    cwd: "C:/repositories/avi/youtube-auto-hd",
    stdio: ["pipe", "ignore", "ignore"]
  });

  try {
    // Wait for Chrome to open and extension to fully load
    console.log("Waiting for Chrome...");
    await waitForChrome();
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Navigate the YouTube tab to the popup
    const pages = await getPages();
    const youtubePage = pages.find(page => page.url.includes("youtube.com") || page.url.includes("about:blank"));
    if (!youtubePage) throw new Error("No page available to navigate");

    await cdpCommand(youtubePage.webSocketDebuggerUrl, "Page.navigate", { url: POPUP_URL });
    console.log("Navigated to popup");

    // Wait for navigation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    const popup = await waitForPopup();
    const wsUrl = popup.webSocketDebuggerUrl;

    // Use a tall viewport so all content renders without overflow constraints
    await cdpCommand(wsUrl, "Emulation.setDeviceMetricsOverride", {
      width: 1280, height: 3000, deviceScaleFactor: 1, mobile: false
    });

    const scrollHeight = await cdpEval(wsUrl, `(async () => {
      // Poll until Svelte mounts
      for (let i = 0; i < 40; i++) {
        if (document.querySelectorAll("input[type=checkbox]").length >= 4) break;
        await new Promise(r => setTimeout(r, 300));
      }
      await new Promise(r => setTimeout(r, 500));

      // Force light theme by overriding CSS variables
      const style = document.createElement("style");
      style.textContent = \`:root {
        --bg-color: hsl(0deg 0% 100%) !important;
        --text-color-primary: hsl(0deg 0% 0%) !important;
        --text-color-secondary: hsl(0deg 0% 53%) !important;
        --text-color-warning: hsl(0deg 0% 0%) !important;
        --bg-color-warning: hsl(0deg 0% 90%) !important;
        --text-color-promotion: hsl(210deg 60% 53%) !important;
        --switch-on-thumb-color: hsl(0deg 93% 61%) !important;
        --switch-on-bg-color: hsl(0deg 100% 90%) !important;
        --switch-off-thumb-color: hsl(0deg 93% 61%) !important;
        --switch-off-bg-color: hsl(0deg 0% 92%) !important;
        --slider-track-cover-color: hsl(0deg 93% 61%) !important;
        --slider-track-uncover-color: hsl(0deg 0% 90%) !important;
        --outline-size-box-wrapper: hsl(0deg 0% 83%) !important;
        --outline-size-box: hsl(0deg 0% 78%) !important;
        --outline-size-box-selected: hsl(0deg 93% 61%) !important;
        --hr-color: hsl(0deg 0% 90%) !important;
        color-scheme: light !important;
      }\`;
      document.head.appendChild(style);

      // Turn off all checked toggles except Extension (index 0), from end to start
      let boxes = [...document.querySelectorAll("input[type=checkbox]")];
      for (let i = boxes.length - 1; i >= 1; i--) {
        if (boxes[i].checked) {
          boxes[i].click();
          await new Promise(r => setTimeout(r, 200));
          boxes = [...document.querySelectorAll("input[type=checkbox]")];
        }
      }
      await new Promise(r => setTimeout(r, 300));

      // Turn ON auto-resize and YouTube Music
      // After turning everything off: [..., autoResize, ytMusic]
      boxes = [...document.querySelectorAll("input[type=checkbox]")];
      boxes[boxes.length - 2].click(); // auto-resize
      boxes[boxes.length - 1].click(); // YouTube Music
      await new Promise(r => setTimeout(r, 500));

      // Turn OFF "Use global quality preferences" (last toggle now that YT Music sub-options appeared)
      boxes = [...document.querySelectorAll("input[type=checkbox]")];
      if (boxes[boxes.length - 1]?.checked) boxes[boxes.length - 1].click();
      await new Promise(r => setTimeout(r, 300));

      // Center content for screenshot — body already has margin:0 auto from CSS
      document.documentElement.style.background = "#f9f9f9";
      await new Promise(r => setTimeout(r, 500));

      return Math.ceil(document.body.getBoundingClientRect().bottom);
    })()`);

    console.log("scrollHeight:", scrollHeight);

    const shot1Data = await cdpScreenshot(wsUrl, 0);
    writeFileSync(`${OUT_DIR}/${locale}-1.png`, Buffer.from(shot1Data, "base64"));
    console.log(`Saved ${locale}-1.png`);

    const clipY2 = scrollHeight > 800 ? scrollHeight - 800 : 0;
    const shot2Data = await cdpScreenshot(wsUrl, clipY2);
    writeFileSync(`${OUT_DIR}/${locale}-2.png`, Buffer.from(shot2Data, "base64"));
    console.log(`Saved ${locale}-2.png`);
  } finally {
    devProcess.kill();
  }
}

mkdirSync(OUT_DIR, { recursive: true });

const locales = process.argv.slice(2);
if (locales.length === 0) {
  console.error("Usage: bun scripts/screenshot-all-locales.mjs de en eo gl he ia it lb pl pt pt_BR pt_PT rm szl");
  process.exit(1);
}

for (const locale of locales) {
  await takeScreenshotsForLocale(locale);
}

await killChrome();
console.log("\nAll done!");
