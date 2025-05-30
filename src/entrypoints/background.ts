import { storage } from "#imports";
import pathIconOn from "@/public/icon-128.png";
import pathIconOff from "@/public/icon-off.png";

function iconActions() {
  storage.watch<boolean>("local:isExtensionEnabled", isEnabled =>
    chrome.action.setIcon({
      path: isEnabled! ? pathIconOn : pathIconOff
    })
  );
}

export default defineBackground(() => {
  chrome.runtime.setUninstallURL("");
  chrome.runtime.onInstalled.addListener(() => {
    iconActions();
  });
});
