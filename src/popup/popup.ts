"use strict";

import { getStorage } from "../shared-scripts/ythd-utilities";
import type { QualityFpsPreferences } from "../types";
import Options from "./Options.svelte";

async function init(): Promise<void> {
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
