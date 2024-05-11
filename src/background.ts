import { Storage } from "@plasmohq/storage";
import pathIconOff from "url:~assets/icon-off.png";
import pathIconOn from "url:~assets/icon-on.png";

const storageLocal = new Storage({ area: "local" });

chrome.runtime.setUninstallURL("");

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
