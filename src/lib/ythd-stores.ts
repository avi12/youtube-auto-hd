import { browser } from "#imports";

export const browserName = (() => {
  const extensionBaseUrl = browser.runtime.getURL("");

  const isFirefox = extensionBaseUrl.startsWith("moz-extension://");
  if (isFirefox) {
    return "firefox";
  }

  const { userAgent } = navigator;

  const isOpera = userAgent.includes("OPR");
  if (isOpera) {
    return "opera";
  }

  const isSafari = userAgent.match(/^((?!chrome|android).)*safari/i);
  if (isSafari) {
    return "safari";
  }

  return "chrome";
})();

type BrowserName = typeof browserName;

// Every brand but Safari puts its own version behind its own token, and Chromium forks carry the
// Chrome token too - so the token to read is decided by the brand already resolved above
const BROWSER_VERSION_TOKENS: Record<BrowserName, string> = {
  chrome: "Chrome",
  firefox: "Firefox",
  opera: "OPR",
  safari: "Version"
};

export const browserVersion =
  navigator.userAgent.match(new RegExp(`${BROWSER_VERSION_TOKENS[browserName]}/([\\d.]+)`))?.[1] ?? "";

export const storeAutoHd: Record<BrowserName, string> = {
  chrome: "https://chromewebstore.google.com/detail/fcphghnknhkimeagdglkljinmpbagone",
  firefox: "https://addons.mozilla.org/firefox/addon/youtube-auto-hd-fps",
  opera: "https://addons.opera.com/extensions/details/app_id/afgnmkmomgakegdfoldjonhgkohhodol",
  safari: "https://apps.apple.com/app/id1546729687"
};

type ExtensionStore = {
  name: string;
  url: string;
};

// Video Time Manager has no Safari listing, so Safari users are never pointed at a store they can't install from
const storesVideoTimeManager: Partial<Record<BrowserName, ExtensionStore>> = {
  chrome: {
    name: "Chrome Web Store",
    url: "https://chromewebstore.google.com/detail/video-time-manager/fpoooibdndpjcnoodfionoeakeojdjaj"
  },
  firefox: {
    name: "Firefox Add-ons",
    url: "https://addons.mozilla.org/firefox/addon/youtube-time-manager@avi12.com"
  },
  opera: {
    name: "Opera add-ons",
    url: "https://addons.opera.com/en/extensions/details/youtube-time-manager"
  }
};

export const storeVideoTimeManager = storesVideoTimeManager[browserName];
