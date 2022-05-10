"use strict";

import Options from "./Options.svelte";
import { getStorage } from "../shared-scripts/ythd-utilities";
import type { QualityFpsPreferences } from "../types";

async function init() {
  const { size: sizeVideo, autoResize: isResizeVideo } = await new Promise(resolve =>
    chrome.storage.sync.get(["size", "autoResize"], resolve)
  );

  new Options({
    target: document.body,
    props: {
      qualitiesStored: await getStorage<QualityFpsPreferences>("local", "qualities"),
      sizeVideo,
      isResizeVideo
    }
  });
}

init();
