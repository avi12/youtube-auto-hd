"use strict";

import Options from "./Options.svelte";
import { getStorage } from "../shared-scripts/ythd-utilities";

async function init() {
  new Options({
    target: document.body,
    props: {
      qualitiesStored: await getStorage("local", "qualities")
    }
  });
}

init();
