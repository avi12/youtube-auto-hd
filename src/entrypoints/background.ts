import { storage } from "#imports";
import pathIconOn from "@/public/icon-128.png";
import pathIconOff from "@/public/icon-off.png";

function iconActions() {
  storage.watch<boolean>("local:isExtensionEnabled", isEnabled =>
    browser.action.setIcon({
      path: isEnabled! ? pathIconOn : pathIconOff
    })
  );
}

export default defineBackground(() => {
  browser.runtime.setUninstallURL("https://bit.ly/43Lna30");
  browser.runtime.onInstalled.addListener(() => {
    iconActions();
  });
});
