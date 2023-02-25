import { Storage } from "@plasmohq/storage";

const storage = {
  local: new Storage({ area: "local" }),
  sync: new Storage({ area: "sync" })
};

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "update") {
    for (const area in storage) {
      const data = await chrome.storage[area].get();
      const storageInstances = Object.keys(data)
        .filter(key => typeof data[key] !== "string")
        .map(key => storage[area].set(key, data[key]));
      await Promise.all(storageInstances);
    }
  }
});

export {};
