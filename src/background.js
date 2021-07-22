"use strict";

import { getStorage } from "./yt-auto-hd-utilities";

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason !== "update") {
    return;
  }

  chrome.storage.sync.remove([
    "rateDisplay",
    "isOfferDonation",
    "isOfferTranslation"
  ]);

  fixCookiesIfNeeded();
});

async function fixCookiesIfNeeded() {
  const { autoResize, size } = await getStorage("sync");
  if (!autoResize) {
    return;
  }

  chrome.cookies.set({
    url: "https://www.youtube.com",
    domain: "youtube.com",
    name: "wide",
    value: size.toString()
  });
}

const manifest = chrome.runtime.getManifest();
const newVersionNumber = manifest.version;

let unreportedUpdateDate;

const landingUrl = "https://apps.jeurissen.co/auto-hd-fps-for-youtube";
const installedUrl = landingUrl + "/installed";
const uninstalledUrl = landingUrl + "/uninstalled";
const updatedUrl = landingUrl + "/whatsnew?installed=1";

function executeUpdate() {
  if (!unreportedUpdateDate) return;
  unreportedUpdateDate = null;
  openUrl(updatedUrl);
  chrome.storage.local.remove("cj_landing_lastupdated");
}

function getMajorVersion(fullVersion) {
  const versionNumbers = fullVersion.split(".");
  return versionNumbers[0] + "." + versionNumbers[1];
}

function openUrl(url) {
  chrome.tabs.create({ url });
}

function triggerUpdateOnBrowserActivity() {
  function callback() {
    executeUpdate();
    chrome.windows.onFocusChanged.removeListener(callback);
    chrome.tabs.onCreated.removeListener(callback);
  }

  chrome.windows.onFocusChanged.addListener(callback);
  chrome.tabs.onCreated.addListener(callback);
}

function init(result) {
  const now = Date.now();

  unreportedUpdateDate = result.cj_landing_lastupdated;
  const storedVersionNumber = result.cj_landing_versionnumber;

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
    triggerUpdateOnBrowserActivity();
  }

  if (storedVersionNumber !== newVersionNumber) {
    chrome.storage.local.set({
      cj_landing_versionnumber: newVersionNumber
    });
  }
}

chrome.runtime.setUninstallURL(uninstalledUrl);

chrome.storage.local.get(
  ["cj_landing_lastupdated", "cj_landing_versionnumber"],
  init
);
