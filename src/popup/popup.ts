"use strict";

import Options from "./Options.svelte";
import { getIsFewerQualityValues, getStorage } from "../shared-scripts/ythd-utilities";
import { initial } from "../shared-scripts/ythd-setup";
import type { FpsOptions } from "../types";

async function init() {
  let qualitiesStored: FpsOptions = await getStorage("local", "qualities");

  if (getIsFewerQualityValues(qualitiesStored, initial.qualities)) {
    qualitiesStored = Object.assign(qualitiesStored, initial.qualities);
  }

  new Options({
    target: document.body,
    props: { qualitiesStored }
  });
}

init();
