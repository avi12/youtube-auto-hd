import { Storage } from "@plasmohq/storage";
import pathIconOff from "url:~assets/icon-off.png";
import pathIconOn from "url:~assets/icon-on.png";


const storage = {
  local: new Storage({ area: "local" }),
  sync: new Storage({ area: "sync" })
};

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "update" && chrome.runtime.getManifest().version === "1.8.9") {
    await storage.sync.set("isHideDonationSection", false);
  }
});

function setIcon(isEnabled = true): void {
  const action = chrome.action || chrome.browserAction; // chrome.browserAction for Firefox MV2
  action.setIcon({
    path: isEnabled ? pathIconOn : pathIconOff
  });
}

storage.local.watch({
  isExtensionEnabled({ newValue: isEnabled }: { newValue: boolean }) {
    setIcon(isEnabled);
  }
});

storage.local.get<boolean>("isExtensionEnabled").then(setIcon);

export {};
