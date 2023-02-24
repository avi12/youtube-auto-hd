import { Storage } from "@plasmohq/storage";

const storageAreas = ["local", "sync"];
const storage = {
  local: new Storage({ area: "local" }),
  sync: new Storage({ area: "sync" })
};

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "update") {
    for (const area of storageAreas) {
      const data = await chrome.storage[area].get();
      const storageInstances = Object.keys(data)
        .filter(key => typeof data[key] !== "string")
        .map(key => storage[area].set(key, data[key]));
      Promise.all(storageInstances);
    }
  }
});

export {};
