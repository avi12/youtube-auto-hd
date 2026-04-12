import {
  readdirSync,
  existsSync,
  cpSync,
  readFileSync,
  mkdirSync
} from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import {
  join,
  basename,
  resolve,
  extname
} from "node:path";
import { defineWebExtConfig } from "wxt";

const CHROMIUM_BROWSERS = ["chrome", "edge", "opera"] as const;
const BROWSERS = [...CHROMIUM_BROWSERS, "firefox"] as const;
const MODES = ["youtube", "iframe", "blank"] as const;

type ChromiumBrowser = typeof CHROMIUM_BROWSERS[number];
type Browser = typeof BROWSERS[number];
type Mode = typeof MODES[number];

function isBrowser(value: string | undefined): value is Browser {
  return BROWSERS.some(name => name === value);
}

function isChromiumBrowser(value: Browser): value is ChromiumBrowser {
  return CHROMIUM_BROWSERS.some(name => name === value);
}

function isMode(value: string | undefined): value is Mode {
  return MODES.some(name => name === value);
}

const {
  LANG = "en",
  BROWSER,
  PROFILE,
  CHROME_PROFILE,
  FIREFOX_PROFILE,
  MODE,
  BLANK,
  AUTOPLAY,
  CONTROLS,
  AMP_CONTROLS,
  CHROME_PORT = "9226",
  FIREFOX_PORT = "9225",
  FIREFOX_MARIONETTE_PORT = "2828"
} = process.env;

const osPlatform = process.platform;
const home = homedir();
const projectRoot = import.meta.dirname;

function detectBrowser(): Browser {
  if (isBrowser(BROWSER)) {
    return BROWSER;
  }
  const args = process.argv;
  const browserFlagIndex = args.findIndex(arg => arg === "-b" || arg === "--browser");
  const flagValue = args[browserFlagIndex + 1];
  if (browserFlagIndex > -1 && isBrowser(flagValue)) {
    return flagValue;
  }
  return "chrome";
}

function detectMode(): Mode {
  if (isMode(MODE)) {
    return MODE;
  }
  if (BLANK) {
    return "blank";
  }
  return "youtube";
}

const browser = detectBrowser();
const mode = detectMode();
const profileName = PROFILE ?? (browser === "firefox" ? FIREFOX_PROFILE : CHROME_PROFILE);

const edgeByPlatform: Partial<Record<NodeJS.Platform, string>> = {
  win32: join(process.env.ProgramFiles ?? "", "Microsoft/Edge/Application/msedge.exe"),
  darwin: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  linux: "/usr/bin/microsoft-edge-stable"
};

const operaByPlatform: Partial<Record<NodeJS.Platform, string>> = {
  win32: join(process.env.LOCALAPPDATA ?? "", "Programs/Opera/opera.exe"),
  darwin: "/Applications/Opera.app/Contents/MacOS/Opera",
  linux: "/usr/bin/opera"
};

const chromiumUserDataSources: Record<ChromiumBrowser, Partial<Record<NodeJS.Platform, string>>> = {
  chrome: {
    win32: join(process.env.LOCALAPPDATA ?? "", "Google/Chrome/User Data"),
    darwin: join(home, "Library/Application Support/Google/Chrome"),
    linux: join(home, ".config/google-chrome")
  },
  edge: {
    win32: join(process.env.LOCALAPPDATA ?? "", "Microsoft/Edge/User Data"),
    darwin: join(home, "Library/Application Support/Microsoft Edge"),
    linux: join(home, ".config/microsoft-edge")
  },
  opera: {
    win32: join(process.env.APPDATA ?? "", "Opera Software/Opera Stable"),
    darwin: join(home, "Library/Application Support/com.operasoftware.Opera"),
    linux: join(home, ".config/opera")
  }
};

const firefoxProfilesRoot: Partial<Record<NodeJS.Platform, string>> = {
  win32: join(process.env.APPDATA ?? "", "Mozilla/Firefox/Profiles"),
  darwin: join(home, "Library/Application Support/Firefox/Profiles"),
  linux: join(home, ".mozilla/firefox")
};

const LOCK_FILES = new Set([
  "lockfile",
  "parent.lock",
  "SingletonLock",
  "SingletonCookie",
  "SingletonSocket",
  "LOCK"
]);

function copyChromiumProfile(browserName: ChromiumBrowser, name: string) {
  const source = chromiumUserDataSources[browserName][osPlatform];
  if (!source || !existsSync(source)) {
    return undefined;
  }

  const destUserData = resolve(projectRoot, "user-data", browserName);
  const destProfile = join(destUserData, name);
  if (existsSync(destProfile)) {
    return destUserData;
  }

  console.log(`Copying ${browserName} profile "${name}" from ${source} to ${destProfile}...`);
  mkdirSync(destUserData, { recursive: true });

  const localState = join(source, "Local State");
  if (existsSync(localState)) {
    cpSync(localState, join(destUserData, "Local State"));
  }

  const sourceProfile = join(source, name);
  if (!existsSync(sourceProfile)) {
    console.warn(`Source profile not found: ${sourceProfile}`);
    return destUserData;
  }
  cpSync(sourceProfile, destProfile, {
    recursive: true,
    filter: src => !LOCK_FILES.has(basename(src))
  });

  console.log("Done.");
  return destUserData;
}

function copyFirefoxProfile(name: string) {
  const source = firefoxProfilesRoot[osPlatform];
  if (!source || !existsSync(source)) {
    return undefined;
  }

  const directoryName = readdirSync(source).find(dir => dir === name || dir.endsWith(`.${name}`));
  if (!directoryName) {
    return undefined;
  }

  const destFirefoxRoot = resolve(projectRoot, "user-data", "firefox");
  const dest = join(destFirefoxRoot, name);
  if (existsSync(dest)) {
    return dest;
  }

  console.log(`Copying Firefox profile "${name}" from ${join(source, directoryName)} to ${dest}...`);
  mkdirSync(destFirefoxRoot, { recursive: true });
  cpSync(join(source, directoryName), dest, {
    recursive: true,
    filter: src => !LOCK_FILES.has(basename(src))
  });

  console.log("Done.");
  return dest;
}

function buildEmbedSource() {
  const params: string[] = [];
  if (AUTOPLAY === "1") {
    params.push("autoplay=1");
  }
  if (CONTROLS === "0") {
    params.push("controls=0");
  }
  if (AMP_CONTROLS === "1") {
    params.push("amp;controls=0");
  }
  const query = params.length > 0 ? `?${params.join("&")}` : "";
  return `https://www.youtube.com/embed/aiSla-5xq3w${query}`;
}

const LOCAL_SERVER_PORT = 3456;
const testsDir = resolve(projectRoot, "tests");

const MIME_TYPES: Partial<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8"
};

function startIframeServer() {
  const HTTP_STATUS_OK = 200;
  const HTTP_STATUS_NOT_FOUND = 404;
  const embedSource = buildEmbedSource();
  const server = createServer((request, response) => {
    const requestPath = decodeURIComponent((request.url ?? "/").split("?")[0]);
    const isEmbedPage = requestPath === "/" || requestPath === "/local-embed.html";
    if (isEmbedPage) {
      const html = readFileSync(join(testsDir, "local-embed.html"), "utf-8")
        .replace(/(<iframe[^>]*\ssrc=)"[^"]*"/, `$1"${embedSource}"`);
      response.writeHead(HTTP_STATUS_OK, { "Content-Type": "text/html; charset=utf-8" });
      response.end(html);
      return;
    }
    const filePath = join(testsDir, requestPath);
    try {
      const content = readFileSync(filePath);
      response.writeHead(HTTP_STATUS_OK, { "Content-Type": MIME_TYPES[extname(filePath)] ?? "text/plain" });
      response.end(content);
    } catch {
      response.writeHead(HTTP_STATUS_NOT_FOUND);
      response.end();
    }
  });
  server.on("error", () => {});
  server.listen(LOCAL_SERVER_PORT);
  return `http://localhost:${LOCAL_SERVER_PORT}/local-embed.html`;
}

function resolveStartUrl() {
  if (mode === "blank") {
    return "about:blank";
  }
  if (mode === "iframe") {
    return startIframeServer();
  }
  return "https://www.youtube.com/watch?v=aiSla-5xq3w";
}

const chromiumUserData = isChromiumBrowser(browser) && profileName
  ? copyChromiumProfile(browser, profileName)
  : undefined;
const firefoxProfilePath = browser === "firefox" && profileName
  ? copyFirefoxProfile(profileName)
  : undefined;

export default defineWebExtConfig({
  binaries: {
    edge: edgeByPlatform[osPlatform] ?? "",
    opera: operaByPlatform[osPlatform] ?? ""
  },
  startUrls: [resolveStartUrl()],
  ...chromiumUserData && {
    keepProfileChanges: true,
    chromiumProfile: chromiumUserData
  },
  ...firefoxProfilePath && {
    keepProfileChanges: true,
    firefoxProfile: firefoxProfilePath
  },
  firefoxArgs: [
    "-marionette",
    "-marionette-port",
    FIREFOX_MARIONETTE_PORT,
    "--remote-debugging-port",
    FIREFOX_PORT
  ],
  chromiumArgs: [
    `--lang=${LANG}`,
    "--isolated",
    "--disable-blink-features=AutomationControlled",
    ...profileName ? [`--profile-directory=${profileName}`] : [],
    `--remote-debugging-port=${CHROME_PORT}`,
    ...mode === "blank" ? ["--disable-features=DarkMode"] : []
  ]
});
