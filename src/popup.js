import Options from "./Options.svelte";
import { getIsFewerQualityValues, getStorage } from "./yt-auto-hd-utilities";
import { initial } from "./yt-auto-hd-setup";

async function init() {
  let [qualitiesStored = {}, { autoResize, size }] = await Promise.all([
    getStorage("local", "qualities"),
    getStorage("sync")
  ]);

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
