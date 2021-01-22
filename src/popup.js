import Options from "./Options.svelte";
import { getIsFewerQualityValues, getStorage } from "./yt-auto-hd-utilities";
import { initial } from "./yt-auto-hd-setup";

async function init() {
  let [
    { qualities: qualitiesStored = {}, qualityFallback = initial.qualityFallback },
    { autoResize, size }
  ] = await Promise.all([getStorage("local"), getStorage("sync")]);

  if (getIsFewerQualityValues(qualitiesStored, initial.qualities)) {
    qualitiesStored = Object.assign(qualitiesStored, initial.qualities);
  }
  new Options({
    target: document.body,
    props: {
      qualitiesStored,
      qualityFallback,
      isResizeVideo: autoResize,
      sizeVideo: size
    }
  });
}

init();
