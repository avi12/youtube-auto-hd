import { Storage } from "@plasmohq/storage";
import pathIconOff from "url:~assets/icon-off.png";
import pathIconOn from "url:~assets/icon-on.png";

if (process.env.NODE_ENV === "production") {
  chrome.runtime.setUninstallURL("https://bit.ly/ythd-flot-ai-uninstall");
}

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({ url: "https://bit.ly/ythd-flot-ai-install" });
  }
});

const storageLocal = new Storage({ area: "local" });

function setIcon(isEnabled = true): void {
  const action = chrome.action || chrome.browserAction; // chrome.browserAction for Firefox MV2
  action.setIcon({
    path: isEnabled ? pathIconOn : pathIconOff
  });
}

storageLocal.watch({
  isExtensionEnabled({ newValue: isEnabled }: { newValue: boolean }) {
    setIcon(isEnabled);
  }
});

storageLocal.get<boolean>("isExtensionEnabled").then(setIcon);

export {};
