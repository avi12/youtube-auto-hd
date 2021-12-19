"use strict";

const manifest = chrome.runtime.getManifest();
const newVersionNumber = manifest.version;

const landingUrl = "https://apps.jeurissen.co/auto-hd-fps-for-youtube";
const installedUrl = landingUrl + "/installed";
const uninstalledUrl = landingUrl + "/uninstalled";
const updatedUrl = landingUrl + "/whatsnew?installed=1";

function getMajorVersion(fullVersion: string): string {
  const [major, minor] = fullVersion.split(".");
  return `${major}.${minor}`;
}

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
  } else if (!unreportedUpdateDate) {
    const majorVersionNumber = getMajorVersion(storedVersionNumber);
    const newMajorVersionNumber = getMajorVersion(newVersionNumber);

    if (newMajorVersionNumber !== majorVersionNumber) {
      unreportedUpdateDate = now;
      chrome.storage.local.set({
        cj_landing_lastupdated: now
      });
    }
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

export {};
