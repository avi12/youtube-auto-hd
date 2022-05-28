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

export {};
