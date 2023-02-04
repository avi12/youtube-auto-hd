"use strict";

import { permissions } from "./permissions/permission-utils";

chrome.runtime.setUninstallURL("https://apps.jeurissen.co/auto-hd-fps-for-youtube/uninstalled");
chrome.storage.local.remove(["cj_landing_lastupdated", "cj_landing_versionnumber"]);

// Asking for permissions, if needed
chrome.permissions.contains(permissions, hasPermission => {
  if (!hasPermission) {
    chrome.tabs.create({ url: chrome.runtime.getURL("permissions.html") });
  }
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  const { version } = chrome.runtime.getManifest();
  if (reason === "update" && version === "1.6.11") {
    chrome.tabs.create({ url: "https://forms.gle/LpSumt1jFpeZpeKDA" });
  }
});

export {};
