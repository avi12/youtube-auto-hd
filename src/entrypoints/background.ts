import { storage, type StorageArea, type StorageItemKey } from "wxt/storage";
import { getValue } from "@/lib/shared-utils";
import pathIconOn from "@/public/icon-128.png";
import pathIconOff from "@/public/icon-off.png";

function iconActions() {
  const action = chrome.action || chrome.browserAction; // chrome.browserAction for Firefox MV2
  storage.watch<boolean>("local:isExtensionEnabled", isEnabled =>
    action.setIcon({
      path: isEnabled! ? pathIconOn : pathIconOff
    })
  );
}

export default defineBackground(() => {
  chrome.runtime.setUninstallURL("");
  chrome.runtime.onInstalled.addListener(async () => {
    const storageAreas: Array<StorageArea> = ["local", "sync"];

    for (const area of storageAreas) {
      const Storage = await browser.storage[area].get();

      const storageSets: Array<{ key: StorageItemKey; value: unknown }> = Object.entries(Storage).map(
        ([key, value]) => ({
          key: `${area}:${key}`,
          value: getValue(value)
        })
      );
      await storage.setItems(storageSets);
    }

    iconActions();
  });
});
