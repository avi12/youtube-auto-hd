const additionalDomain = !navigator?.userAgent?.includes("Android")
  ? "https://youtube.googleapis.com/*"
  : "https://m.youtube.com/*";

export const permissions: chrome.permissions.Permissions = {
  origins: ["https://www.youtube.com/*", "https://www.youtube-nocookie.com/*", additionalDomain]
};
