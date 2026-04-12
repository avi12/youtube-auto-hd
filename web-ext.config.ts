import { readdirSync, existsSync, cpSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { join, basename, resolve, extname } from "node:path";
import { defineWebExtConfig } from "wxt";

const {
  LANG = "en",
  BLANK,
  CHROME_PROFILE,
  CHROME_PORT = "9226",
  CHROME_INSTANCE = "",
  FIREFOX_PROFILE,
  FIREFOX_PORT = "9225",
  FIREFOX_MARIONETTE_PORT = "2828"
} = process.env;

const osPlatform = process.platform;
const home = homedir();

const edgeByPlatform: Partial<Record<NodeJS.Platform, string>> = {
  win32: join(process.env.ProgramFiles!, "Microsoft/Edge/Application/msedge.exe"),
  darwin: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  linux: "/usr/bin/microsoft-edge-stable"
};

const operaByPlatform: Partial<Record<NodeJS.Platform, string>> = {
  win32: join(process.env.LOCALAPPDATA!, "Programs/Opera/opera.exe"),
  darwin: "/Applications/Opera.app/Contents/MacOS/Opera",
  linux: "/usr/bin/opera"
};

function findDefaultFirefoxProfile() {
  const profilesDir = (() => {
    if (osPlatform === "win32") {
      return join(process.env.APPDATA!, "Mozilla/Firefox/Profiles");
    }
    if (osPlatform === "darwin") {
      return join(home, "Library/Application Support/Firefox/Profiles");
    }
    return join(home, ".mozilla/firefox");
  })();
  if (!existsSync(profilesDir)) {
    return undefined;
  }
  const profiles = readdirSync(profilesDir);
  const found = profiles.find(dir => dir.endsWith(".default-release")) ?? profiles.find(dir => dir.includes("default")) ?? profiles[0];
  if (found) {
    return join(profilesDir, found);
  }
}

const LOCK_FILES = new Set(["lockfile", "SingletonLock", "SingletonCookie", "SingletonSocket", "LOCK"]);

function copyChromeProfiles() {
  const chromeSrcByPlatform: Partial<Record<NodeJS.Platform, string>> = {
    win32: join(process.env.LOCALAPPDATA!, "Google", "Chrome", "User Data"),
    darwin: join(home, "Library", "Application Support", "Google", "Chrome"),
    linux: join(home, ".config", "google-chrome")
  };
  const src = chromeSrcByPlatform[osPlatform];
  if (!src || !existsSync(src)) {
    return;
  }

  const suffix = CHROME_INSTANCE ? `-${CHROME_INSTANCE}` : "";
  const dest = resolve(import.meta.dirname, `../User Data${suffix}`);
  if (existsSync(dest)) {
    return dest;
  }

  console.log(`Copying Chrome profiles from ${src} to ${dest}...`);
  cpSync(join(src, "Local State"), join(dest, "Local State"));

  const profileDirectories = readdirSync(src).filter(name => name === "Default" || name.startsWith("Profile "));
  for (const directory of profileDirectories) {
    cpSync(join(src, directory), join(dest, directory), {
      recursive: true,
      filter: source => !LOCK_FILES.has(basename(source))
    });
  }

  console.log("Done.");
  return dest;
}

const chromeUserData = CHROME_PROFILE ? copyChromeProfiles() : undefined;

const LOCAL_SERVER_PORT = 3456;
const testsDir = resolve(import.meta.dirname, "tests");

const MIME_TYPES: Partial<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8"
};

function startLocalServer() {
  const server = createServer((request, response) => {
    const filePath = join(testsDir, decodeURIComponent(request.url ?? "/"));
    try {
      const content = readFileSync(filePath);
      response.writeHead(200, { "Content-Type": MIME_TYPES[extname(filePath)] ?? "text/plain" });
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  server.on("error", () => {}); // silently ignore EADDRINUSE if already running
  server.listen(LOCAL_SERVER_PORT);
  return `http://localhost:${LOCAL_SERVER_PORT}/local-embed.html`;
}

const localEmbedUrl = startLocalServer();

export default defineWebExtConfig({
  binaries: {
    edge: edgeByPlatform[osPlatform] ?? "",
    opera: operaByPlatform[osPlatform] ?? ""
  },
  startUrls: [localEmbedUrl],
  ...chromeUserData && {
    keepProfileChanges: true,
    chromiumProfile: chromeUserData
  },
  ...FIREFOX_PROFILE && {
    firefoxProfile: findDefaultFirefoxProfile(),
    keepProfileChanges: true
  },
  firefoxArgs: [
    "-marionette",
    "-marionette-port", FIREFOX_MARIONETTE_PORT,
    "--remote-debugging-port", FIREFOX_PORT
  ],
  chromiumArgs: [
    `--lang=${LANG}`,
    "--isolated",
    "--disable-blink-features=AutomationControlled",
    `--profile-directory=${CHROME_PROFILE ?? "Default"}`,
    `--remote-debugging-port=${CHROME_PORT}`,
    ...BLANK ? ["--disable-features=DarkMode"] : []
  ]
});
