import { storage, type StorageArea, type StorageItemKey } from "wxt/storage";
import { getValue } from "@/lib/ythd-utils";
import pathIconOn from "@/public/icon-128.png";
import pathIconOff from "@/public/icon-off.png";

function setIcon(isEnabled: boolean) {
  const action = chrome.action || chrome.browserAction; // chrome.browserAction for Firefox MV2
  action.setIcon({
    path: isEnabled ? pathIconOn : pathIconOff
  });
}

async function iconActions() {
  storage.watch<boolean>("local:isExtensionEnabled", isEnabled => setIcon(isEnabled!));
}

export default defineBackground(() => {
  chrome.runtime.setUninstallURL("");
  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== chrome.runtime.OnInstalledReason.UPDATE) {
      return;
    }

    const storageAreas: Array<StorageArea> = ["local", "sync"];

    for (const area of storageAreas) {
      const Storage = await browser.storage[area].get();

      const storageSets: Array<{ key: StorageItemKey; value: any }> = Object.entries(Storage).map(([key, value]) => ({
        key: `${area}:${key}`,
        value: getValue(value)
      }));
      await storage.setItems(storageSets);
    }

    await iconActions();
  });
});
