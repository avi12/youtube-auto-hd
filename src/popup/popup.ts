"use strict";

import Options from "./Options.svelte";
import { getIsFewerQualityValues } from "../shared-scripts/ythd-utilities";
import { initial } from "../shared-scripts/ythd-setup";
import type { AutoResize, FpsOptions, Size } from "../types";

async function init() {
  let { qualities: qualitiesStored }: { qualities: FpsOptions } = await new Promise(resolve =>
    chrome.storage.local.get("qualities", resolve)
  );
  const { autoResize, size }: { autoResize: AutoResize; size: Size } = await new Promise(resolve =>
    chrome.storage.sync.get(["autoResize", "size"], resolve)
  );

  if (getIsFewerQualityValues(qualitiesStored, initial.qualities)) {
    qualitiesStored = Object.assign(qualitiesStored, initial.qualities);
  }
  new Options({
    target: document.body,
    props: {
      qualitiesStored,
      isResizeVideo: autoResize,
      sizeVideo: size
    }
  });
}

init();
