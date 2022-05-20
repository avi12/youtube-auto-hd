"use strict";

import { permissions } from "./permissions/permission-utils";

const manifest = chrome.runtime.getManifest();
const newVersionNumber = manifest.version;

const landingUrl = "https://apps.jeurissen.co/auto-hd-fps-for-youtube";
const installedUrl = landingUrl + "/installed";
const uninstalledUrl = landingUrl + "/uninstalled";
const updatedUrl = landingUrl + "/whatsnew?installed=1";

function openUrl(url: string): void {
  chrome.tabs.create({ url });
}

function init({
  cj_landing_lastupdated,
  cj_landing_versionnumber
}: {
  cj_landing_lastupdated?: number;
  cj_landing_versionnumber?: string;
}): void {
  const now = Date.now();

  let unreportedUpdateDate = cj_landing_lastupdated;
  const storedVersionNumber = cj_landing_versionnumber;

  if (typeof storedVersionNumber !== "string") {
    openUrl(installedUrl);
  } else if (!unreportedUpdateDate && newVersionNumber !== storedVersionNumber) {
    unreportedUpdateDate = now;
    chrome.storage.local.set({
      cj_landing_lastupdated: now
    });
  }

  if (unreportedUpdateDate) {
    const callback = () => {
      if (unreportedUpdateDate) {
        unreportedUpdateDate = null;
        openUrl(updatedUrl);
        chrome.storage.local.remove("cj_landing_lastupdated");
      }
      chrome.windows.onFocusChanged.removeListener(callback);
      chrome.tabs.onCreated.removeListener(callback);
    };

    chrome.windows.onFocusChanged.addListener(callback);
    chrome.tabs.onCreated.addListener(callback);
  }

  if (storedVersionNumber !== newVersionNumber) {
    chrome.storage.local.set({
      cj_landing_versionnumber: newVersionNumber
    });
  }
}

chrome.runtime.setUninstallURL(uninstalledUrl);

chrome.storage.local.get(["cj_landing_lastupdated", "cj_landing_versionnumber"], init);

// Asking for permissions, if needed
chrome.permissions.contains(permissions, hasPermission => {
  if (!hasPermission) {
    chrome.tabs.create({ url: chrome.runtime.getURL("permissions.html") });
  }
});

export {};
