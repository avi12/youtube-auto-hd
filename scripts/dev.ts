/**
 * Dev server: builds the extension, sideloads it in Chrome, and reloads what actually changed
 * on every save - adapted from Video Time Manager's `scripts/dev-*.ts`.
 *
 * Why not `wxt` on its own: its watcher runs on native fs events, which on Windows can stop
 * delivering without the process noticing - the server stays up, the port stays bound, and
 * saves silently stop reaching the browser. The watcher here polls instead (chokidar's polling
 * mode compares mtime snapshots, so a file being READ - by the bundler, the TS server, a
 * project-wide search - can never register as a change), every failure is logged to a file that
 * survives a kill, and the browser is polled for liveness so a closed window ends the session.
 *
 * What each kind of change costs:
 *   popup / options HTML  ->  reload only those open pages; content-script contexts survive
 *   any script, _locales, .env  ->  reload the extension, then the tabs
 *   a save that changes no output  ->  nothing
 *
 * There is no "reload the tab but not the extension" shortcut for a content-script edit: Chrome
 * injects from the copy of the script it cached when the extension loaded, so the tab would come
 * back running the old code.
 *
 * The browser launch itself stays in `web-ext.config.ts` - profiles, start URL, modes and the
 * debug port are read from there, so `wxt -b opera` and `wxt -b firefox` keep behaving exactly
 * as before and there is one place that describes how the dev browser comes up.
 *
 * Usage: pnpm dev   (MODE=iframe / BLANK=1 / PROFILE=... are read by web-ext.config.ts)
 */

import webExtConfig from "../web-ext.config";
import { getIsBrowserAlive, reloadContentScriptPages, reloadOpenExtensionPages } from "./dev-cdp";
import chokidar from "chokidar";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { join, resolve } from "node:path";
import { inspect } from "node:util";
import webExtRun from "web-ext-run";
import { build, type Entrypoint } from "wxt";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const DEV_LOG_DIR = resolve(PROJECT_ROOT, ".dev-logs");
const DEFAULT_CDP_PORT = 9226;

// The build starts only once a file has been quiet this long, so it never reads a half-written
// save, and a burst of saves across several files costs one build.
const REBUILD_DEBOUNCE_MILLISECONDS = 800;
const WATCH_POLL_INTERVAL_MILLISECONDS = 500;

// WXT/Vite bake VITE_*/WXT_* values into every chunk at build time, so an env edit is a rebuild
// and a full reload - never an in-place swap. This is the cascade Vite loads for `development`.
const ENV_FILES = [".env", ".env.local", ".env.development", ".env.development.local"];
// Public assets are copied verbatim, so a locale's output path is its source path minus this.
const PUBLIC_SOURCE_PREFIX = "src/public/";
const LOCALES_SOURCE_PREFIX = `${PUBLIC_SOURCE_PREFIX}_locales/`;

// Entrypoint types whose output is a script rather than a page. Everything else (the popup,
// which doubles as the options page) can be refreshed on its own.
const SCRIPT_ENTRYPOINT_TYPES = new Set([
  "background",
  "content-script",
  "unlisted-script",
  "unlisted-style",
  "content-script-style"
]);

type ManifestContentScript = {
  js?: string[];
  css?: string[];
  world?: "ISOLATED" | "MAIN";
};

type ExtensionManifest = {
  background?: {
    service_worker?: string;
    scripts?: string[];
  };
  content_scripts?: ManifestContentScript[];
};

// ── Dev log ───────────────────────────────────────────────────────────────────

// The terminal is gone the moment the process is killed, which is exactly the case that needs
// explaining. Every console line is mirrored to .dev-logs/chrome.log, and the previous session
// is kept beside it, so a restart-to-look-at-it never wipes the log that says what happened.
const DEV_LOG_MAX_BYTES = 1_000_000;
const DEV_LOG_MAX_ENTRY_CHARACTERS = 2000;
const devLogPath = join(DEV_LOG_DIR, "chrome.log");
const devLogPreviousPath = join(DEV_LOG_DIR, "chrome.prev.log");
let devLogBytes = 0;

function rotateDevLog() {
  try {
    renameSync(devLogPath, devLogPreviousPath);
  } catch { /* the previous log is locked - truncating in place below is the fallback */ }

  writeFileSync(devLogPath, "");
  devLogBytes = 0;
}

function appendToDevLog(level: string, args: unknown[]) {
  let text = args
    .map(argument => typeof argument === "string" ? argument : inspect(argument, {
      depth: 2,
      breakLength: 120
    }))
    .join(" ");
  if (text.length > DEV_LOG_MAX_ENTRY_CHARACTERS) {
    text = `${text.slice(0, DEV_LOG_MAX_ENTRY_CHARACTERS)} ...[truncated]`;
  }

  const line = `[${new Date().toISOString()}] [${level}] ${text}\n`;
  try {
    if (devLogBytes + line.length > DEV_LOG_MAX_BYTES) {
      rotateDevLog();
    }

    appendFileSync(devLogPath, line);
    devLogBytes += line.length;
  } catch { /* logging must never take the dev server down */ }
}

function initDevLog() {
  mkdirSync(DEV_LOG_DIR, { recursive: true });

  if (existsSync(devLogPath)) {
    try {
      renameSync(devLogPath, devLogPreviousPath);
    } catch { /* still locked - the truncate below wins */ }
  }

  writeFileSync(devLogPath, "");
  devLogBytes = 0;

  for (const level of ["log", "warn", "error"] as const) {
    const logOriginal = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      logOriginal(...args);
      appendToDevLog(level, args);
    };
  }
}

function logEvent(message: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

// An unhandled rejection aborts Node by default, which is how a dev server dies mid-session with
// nothing on screen. Log both kinds in full and stay up - a CDP hiccup during a reload is not
// worth ending the session over.
function installProcessDiagnostics() {
  process.on("uncaughtException", (error, origin) => {
    // A closed terminal makes every console write throw EPIPE, which would throw again from the
    // handler and spin. There is no session left to keep alive, so leave.
    const isBrokenPipe = error instanceof Error && "code" in error && error.code === "EPIPE";
    if (isBrokenPipe) {
      process.exit(1);
    }

    logEvent(`uncaughtException (${origin}) - staying up:`);
    console.error(error);
  });
  process.on("unhandledRejection", reason => {
    // Vite's own watcher throws this when it tries to watch a file Chrome or WXT holds open on
    // Windows. The watch fails, the build does not - so it is noise.
    const isWatcherFileLock =
      reason instanceof Error &&
      "code" in reason &&
      reason.code === "EBUSY" &&
      "syscall" in reason &&
      reason.syscall === "watch";
    if (isWatcherFileLock) {
      return;
    }

    logEvent("unhandledRejection - staying up:");
    console.error(reason);
  });
}

// ── Env ───────────────────────────────────────────────────────────────────────

function parseEnvFile(path: string) {
  const entries: Record<string, string> = {};
  for (const rawLine of readFileSync(path, "utf-8").split(/\r?\n/)) {
    const line = rawLine.trim();
    const equalsIndex = line.indexOf("=");
    const isCommentOrBlank = !line || line.startsWith("#");
    if (isCommentOrBlank || equalsIndex === -1) {
      continue;
    }

    entries[line.slice(0, equalsIndex).trim()] = line.slice(equalsIndex + 1).trim();
  }

  return entries;
}

// Vite prefers an already-set process.env var over the file it came from, so the values read at
// startup would otherwise be frozen for the life of the process and every rebuild after an env
// edit would keep baking the stale one. Re-read and overwrite, least-specific file first so the
// most-specific still wins.
function reloadDevEnv() {
  for (const file of ENV_FILES) {
    const path = resolve(PROJECT_ROOT, file);
    if (existsSync(path)) {
      Object.assign(process.env, parseEnvFile(path));
    }
  }
}

// ── Build ─────────────────────────────────────────────────────────────────────

// Resolved from WXT itself rather than repeating wxt.config.ts's outDirTemplate here.
let outputDir = "";
// HTML entrypoints keyed by the path their edits arrive under -> entrypoint name.
let htmlEntrypointsByWatchPath = new Map<string, string>();

// Where an entrypoint's edits show up: the containing directory for a directory entrypoint
// (popup/index.html -> src/entrypoints/popup/), the file itself for a single-file one.
function entrypointWatchPath(inputPath: string) {
  const projectPrefix = `${PROJECT_ROOT.replaceAll("\\", "/")}/`;
  const normalizedPath = inputPath.replaceAll("\\", "/");
  if (!normalizedPath.startsWith(projectPrefix)) {
    return undefined;
  }

  const relativePath = normalizedPath.slice(projectPrefix.length);
  const fileName = relativePath.slice(relativePath.lastIndexOf("/") + 1);
  const isDirectoryEntrypoint = fileName.startsWith("index.");
  return isDirectoryEntrypoint ? relativePath.slice(0, relativePath.lastIndexOf("/") + 1) : relativePath;
}

function getIsPathInEntrypoint({ normalizedPath, watchPath }: {
  normalizedPath: string;
  watchPath: string;
}) {
  return watchPath.endsWith("/") ? normalizedPath.startsWith(watchPath) : normalizedPath === watchPath;
}

function recordEntrypoints(entrypoints: Entrypoint[]) {
  const nextHtmlEntrypoints = new Map<string, string>();
  for (const entrypoint of entrypoints) {
    const watchPath = entrypointWatchPath(entrypoint.inputPath);
    if (!watchPath || SCRIPT_ENTRYPOINT_TYPES.has(entrypoint.type)) {
      continue;
    }

    nextHtmlEntrypoints.set(watchPath, entrypoint.name);
  }

  htmlEntrypointsByWatchPath = nextHtmlEntrypoints;
}

function buildExtension() {
  return build({
    root: PROJECT_ROOT,
    browser: "chrome",
    // Development mode: unminified, `import.meta.env.PROD` false - which is what keeps the
    // analytics silent and the [YTHD] debug logging on in a sideloaded build.
    mode: "development",
    manifestVersion: 3,
    hooks: {
      "entrypoints:resolved"(wxt, entrypoints) {
        outputDir = wxt.config.outDir;
        recordEntrypoints(entrypoints);
      }
    }
  });
}

// A rebuild can die on a transient Windows file lock: Chrome serves the extension straight off
// the output directory and holds files open while reading them, so a build that empties the
// directory inside that window fails with EPERM. Builds are idempotent, so a short retry rides
// over the lock instead of dropping the save. A real failure (a syntax error) rethrows at once.
const TRANSIENT_FILE_ERROR_PATTERN = /EPERM|EBUSY/;
const BUILD_RETRY_DELAY_MILLISECONDS = 300;
const MAX_BUILD_ATTEMPTS = 3;

async function runBuildWithRetry() {
  for (let attempt = 1; ; attempt++) {
    try {
      return await buildExtension();
    } catch (error) {
      const isTransientFileError = TRANSIENT_FILE_ERROR_PATTERN.test(String(error));
      if (!isTransientFileError || attempt >= MAX_BUILD_ATTEMPTS) {
        throw error;
      }

      logEvent(`Build hit a file lock (attempt ${attempt}/${MAX_BUILD_ATTEMPTS}) - retrying`);
      await new Promise(resolvePromise => setTimeout(resolvePromise, BUILD_RETRY_DELAY_MILLISECONDS));
    }
  }
}

function readManifest(): ExtensionManifest | undefined {
  const manifestPath = join(outputDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    return undefined;
  }

  return JSON.parse(readFileSync(manifestPath, "utf-8"));
}

type OutputFingerprint = {
  background: string;
  mainWorldContentScripts: string;
  contentScriptsByFile: Map<string, string>;
};

const EMPTY_FINGERPRINT: OutputFingerprint = {
  background: "",
  mainWorldContentScripts: "",
  contentScriptsByFile: new Map()
};

function hashFiles(files: string[]) {
  const hash = createHash("sha1");
  for (const file of files) {
    const absolutePath = join(outputDir, file);
    if (existsSync(absolutePath)) {
      hash.update(file);
      hash.update(readFileSync(absolutePath));
    }
  }

  return hash.digest("hex");
}

// What each reloadable part of the output is, by content rather than by mtime: WXT rewrites every
// output on every build, usually with identical bytes, so mtime says "a build ran" - which would
// make every save look like a background change and cost a full extension reload. Hashing answers
// the question that actually decides the reload: did this part EFFECTIVELY change.
// A shared module edit still registers, because the chunk it lands in is renamed and the entry
// file that imports it is rewritten with the new name.
function fingerprintOutputs(): OutputFingerprint {
  const manifest = readManifest();
  if (!manifest) {
    return EMPTY_FINGERPRINT;
  }

  // Chrome MV3 declares the background as service_worker and Firefox MV3 as scripts[]; reading
  // only one shape would go blind to background edits on the other.
  const backgroundFiles = [
    ...manifest.background?.service_worker ? [manifest.background.service_worker] : [],
    ...manifest.background?.scripts ?? []
  ];

  const contentScriptsByFile = new Map<string, string>();
  const mainWorldFiles: string[] = [];
  for (const entry of manifest.content_scripts ?? []) {
    const entryFiles = [...entry.js ?? [], ...entry.css ?? []];
    for (const file of entryFiles) {
      contentScriptsByFile.set(file, hashFiles([file]));
    }

    // A MAIN-world script runs in the page's own context, so nothing short of replacing the
    // document re-runs it - it is tracked apart from the isolated ones for that reason.
    if (entry.world === "MAIN") {
      mainWorldFiles.push(...entryFiles);
    }
  }

  return {
    background: hashFiles(backgroundFiles),
    mainWorldContentScripts: hashFiles(mainWorldFiles),
    contentScriptsByFile
  };
}

function diffOutputs({ before, after }: {
  before: OutputFingerprint;
  after: OutputFingerprint;
}) {
  const changedContentScriptFiles = new Set<string>();
  for (const [file, hash] of after.contentScriptsByFile) {
    if (before.contentScriptsByFile.get(file) !== hash) {
      changedContentScriptFiles.add(file);
    }
  }

  return {
    isBackgroundChanged: before.background !== after.background,
    isMainWorldChanged: before.mainWorldContentScripts !== after.mainWorldContentScripts,
    changedContentScriptFiles
  };
}

// ── Launch ────────────────────────────────────────────────────────────────────

// web-ext.config.ts already puts the debug port on the command line; read it back from there so
// the dev server and the browser can never disagree about which port to talk on.
function resolveCdpPort() {
  const portArgument = (webExtConfig.chromiumArgs ?? [])
    .map(argument => String(argument).match(/^--remote-debugging-port=(\d+)$/)?.[1])
    .find(port => port !== undefined);
  return portArgument ? Number(portArgument) : DEFAULT_CDP_PORT;
}

function launchChrome() {
  return webExtRun.cmd.run(
    {
      target: "chromium",
      sourceDir: outputDir,
      startUrl: webExtConfig.startUrls,
      chromiumProfile: webExtConfig.chromiumProfile,
      keepProfileChanges: webExtConfig.keepProfileChanges,
      args: webExtConfig.chromiumArgs,
      // This server owns reloading; web-ext's own watcher would fight it for the output dir.
      noReload: true,
      noInput: true
    },
    { shouldExitProgram: false }
  );
}

// ── Dev server ────────────────────────────────────────────────────────────────

async function runDevServer() {
  initDevLog();
  installProcessDiagnostics();
  process.chdir(PROJECT_ROOT);

  const cdpPort = resolveCdpPort();
  // Something is already answering on the debug port - almost always a dev browser from an
  // earlier session that outlived its server. Chrome would fail to bind the port and every
  // reload from here would be delivered to THAT browser instead, so stop while it is still
  // obvious what happened.
  if (await getIsBrowserAlive(cdpPort)) {
    logEvent(`Debug port ${cdpPort} is already in use - close the other dev browser (or set CHROME_PORT) and start again`);
    process.exit(1);
  }

  console.log("Building the extension for Chrome (development)...");
  await runBuildWithRetry();
  console.log(`Build complete -> ${outputDir}\n`);

  const runner = await launchChrome();
  logEvent(`Chrome launched with the extension sideloaded (debug port ${cdpPort})`);
  logEvent(`Dev log -> ${devLogPath}`);
  console.log("\nWatching for file changes...\n");

  let isRebuilding = false;
  let isExiting = false;
  let pendingChange: string | undefined;
  let isFullReloadPending = false;
  let isEnvChangePending = false;
  let isLocaleChangePending = false;
  const pendingHtmlEntrypoints = new Set<string>();
  let debounceTimer: NodeJS.Timeout | undefined;

  async function rebuildAndReload({ filePath, isFullReloadNeeded, isEnvChange, isLocaleChange, htmlEntrypoints }: {
    filePath: string;
    isFullReloadNeeded: boolean;
    isEnvChange: boolean;
    isLocaleChange: boolean;
    htmlEntrypoints: Set<string>;
  }) {
    const startedAt = Date.now();
    logEvent(`Changed: ${filePath} - rebuilding`);

    try {
      if (isEnvChange) {
        reloadDevEnv();
      }

      const outputsBefore = fingerprintOutputs();
      await runBuildWithRetry();

      if (!isFullReloadNeeded) {
        // Nothing a running context depends on moved, so leave every content script alone and
        // refresh only the pages that are open right now.
        for (const entrypointName of htmlEntrypoints) {
          await reloadOpenExtensionPages({
            entrypointName,
            cdpPort
          });
        }

        logEvent(`Reloaded in ${Date.now() - startedAt}ms - ${[...htmlEntrypoints].join(", ")} page only, extension untouched`);
        return;
      }

      const { isBackgroundChanged, isMainWorldChanged, changedContentScriptFiles } = diffOutputs({
        before: outputsBefore,
        after: fingerprintOutputs()
      });
      // Reloading the tab is NOT enough for a content-script edit, however tempting it looks:
      // Chrome injects registered content scripts from the copy it cached when the extension was
      // loaded, so a navigated tab faithfully re-injects the OLD code and the save appears to do
      // nothing. Only reloading the extension makes Chrome re-read the file - and that in turn
      // invalidates every content-script context, so the tabs have to follow it. Same for the
      // _locales catalog (read once at load) and for an env edit (re-baked into every chunk).
      const isReloadNeeded =
        isBackgroundChanged ||
        isMainWorldChanged ||
        changedContentScriptFiles.size > 0 ||
        isEnvChange ||
        isLocaleChange;
      if (!isReloadNeeded) {
        logEvent(`No output changed in ${Date.now() - startedAt}ms - nothing to reload`);
        return;
      }

      await runner.reloadAllExtensions();
      const reloadedPages = await reloadContentScriptPages(cdpPort);
      logEvent(`Reloaded in ${Date.now() - startedAt}ms - extension + ${reloadedPages} page(s)`);
    } catch (error) {
      logEvent("Rebuild failed - fix it and save again:");
      console.error(error);
    }
  }

  // A save that lands mid-rebuild is parked and drained afterwards, so two builds never run
  // against the same output directory at once.
  async function drainPendingRebuild() {
    if (isRebuilding) {
      return;
    }

    isRebuilding = true;
    while (pendingChange !== undefined) {
      const filePath = pendingChange;
      const isFullReloadNeeded = isFullReloadPending;
      const isEnvChange = isEnvChangePending;
      const isLocaleChange = isLocaleChangePending;
      const htmlEntrypoints = new Set(pendingHtmlEntrypoints);
      pendingChange = undefined;
      isFullReloadPending = false;
      isEnvChangePending = false;
      isLocaleChangePending = false;
      pendingHtmlEntrypoints.clear();

      await rebuildAndReload({
        filePath,
        isFullReloadNeeded,
        isEnvChange,
        isLocaleChange,
        htmlEntrypoints
      });
    }

    isRebuilding = false;
  }

  function scheduleRebuild(filePath: string) {
    const normalizedPath = filePath.replaceAll("\\", "/");
    pendingChange = filePath;

    if (ENV_FILES.includes(normalizedPath)) {
      isEnvChangePending = true;
    }

    if (normalizedPath.startsWith(LOCALES_SOURCE_PREFIX)) {
      isLocaleChangePending = true;
    }

    // The HTML fast path is only safe while nothing else in the same window forced a full
    // reload - once forced it cannot be downgraded.
    const matchedHtmlEntrypoint = [...htmlEntrypointsByWatchPath.entries()]
      .find(([watchPath]) => getIsPathInEntrypoint({
        normalizedPath,
        watchPath
      }));
    const isHtmlOnly = Boolean(matchedHtmlEntrypoint) && !isEnvChangePending && !isLocaleChangePending;
    if (isHtmlOnly && !isFullReloadPending && matchedHtmlEntrypoint) {
      pendingHtmlEntrypoints.add(matchedHtmlEntrypoint[1]);
    } else {
      isFullReloadPending = true;
      pendingHtmlEntrypoints.clear();
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void drainPendingRebuild(), REBUILD_DEBOUNCE_MILLISECONDS);
  }

  const watcher = chokidar.watch(["src", "wxt.config.ts", "web-ext.config.ts", ...ENV_FILES], {
    cwd: PROJECT_ROOT.replaceAll("\\", "/"),
    ignoreInitial: true,
    // Polling, not native fs events: a read can never look like a write, and a watch that stops
    // delivering is the failure this whole script exists to rule out.
    usePolling: true,
    interval: WATCH_POLL_INTERVAL_MILLISECONDS
  });
  watcher.on("error", error => {
    logEvent("Watcher error:");
    console.error(error);
  });
  watcher.on("all", (_event, filePath) => scheduleRebuild(filePath));

  async function exit() {
    if (isExiting) {
      return;
    }

    isExiting = true;
    logEvent("Shutting down - closing the watcher and the browser");
    // Guarantee the process ends even if a teardown stalls, so closing the browser always ends
    // the dev server rather than leaving an orphan watcher behind.
    setTimeout(() => process.exit(0), 3000).unref();
    await watcher.close().catch(() => {});
    await runner.exit().catch(error => {
      logEvent("Closing the browser failed:");
      console.error(error);
    });
    process.exit(0);
  }

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => void exit());
  }

  runner.registerCleanup(() => {
    logEvent("Chrome closed");
    void exit();
  });

  // Belt and braces with registerCleanup, whose callback is unreliable on Windows: poll the debug
  // port and leave once it stops answering. A short streak is required so a hiccup during a
  // reload never ends the session; exit() is idempotent, so whichever notices first wins.
  const LIVENESS_POLL_MILLISECONDS = 2000;
  const MAX_CONSECUTIVE_FAILURES = 3;

  async function monitorBrowserLiveness() {
    let consecutiveFailures = 0;
    while (!isExiting) {
      await new Promise(resolvePromise => setTimeout(resolvePromise, LIVENESS_POLL_MILLISECONDS));

      if (isExiting) {
        return;
      }

      if (await getIsBrowserAlive(cdpPort)) {
        consecutiveFailures = 0;
        continue;
      }

      consecutiveFailures++;

      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        logEvent("Chrome is no longer reachable - shutting down");
        void exit();
        return;
      }
    }
  }
  void monitorBrowserLiveness();

  // Stay up until something calls exit()
  await new Promise(() => {});
}

runDevServer().catch(error => {
  logEvent("Fatal error - the dev server could not start:");
  console.error(error);
  process.exit(1);
});
