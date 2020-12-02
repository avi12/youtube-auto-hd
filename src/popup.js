import Options from "./components/Options.svelte";
import { getIsFewerQualityValues, getStorage } from "./yt-auto-hd-utilities";
import { initial } from "./yt-auto-hd-setup";

async function init() {
  let [
    qualitiesStored = {},
    {
      autoResize: isResizeVideo = initial.autoResize,
      size: sizeVideo = initial.size,
      rateDisplay: isDisplayRateOffer = true,
      isOfferTranslation: isDisplayTranslationOffer = true,
      isOfferDonation: isDisplaySupportOffer = true,
    },
  ] = await Promise.all([getStorage("local", "qualities"), getStorage("sync")]);

  if (getIsFewerQualityValues(qualitiesStored, initial.qualities)) {
    qualitiesStored = Object.assign(qualitiesStored, initial.qualities);
  }

  const app = new Options({
    target: document.body,
    props: {
      qualitiesStored,
      isResizeVideo,
      sizeVideo,
      isDisplayRateOffer,
      isDisplayTranslationOffer,
      isDisplaySupportOffer,
    },
  });
}

init();
