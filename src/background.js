"use strict";

const baseUrl = "https://apps.jeurissen.co/auto-hd-fps-for-youtube";
chrome.runtime.onInstalled.addListener(({ reason }) => {
  switch (reason) {
    case "update":
      chrome.tabs.create({
        url: `${baseUrl}/whatsnew?installed=1`
      });
      break;

    case "install":
      chrome.tabs.create({
        url: `${baseUrl}/installed`
      });
      break;
  }
});

chrome.runtime.setUninstallURL(`${baseUrl}/uninstalled`);
