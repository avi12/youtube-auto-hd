import { Storage } from "@plasmohq/storage";

import { labelToQuality } from "~shared-scripts/ythd-setup";
import {
  SELECTORS,
  getElementByMutationObserver,
  getFpsFromRange,
  getPreferredQualities
} from "~shared-scripts/ythd-utils";
import type { QualityFpsPreferences, VideoFPS, VideoQuality, YouTubeLabel } from "~types";

let gPlayerResponse;
const EVENT = new Event("change", { bubbles: true });

function getVideoFPS(): VideoFPS {
  return gPlayerResponse.streamingData.adaptiveFormats[0].fps;
}

function getCurrentQualities(): YouTubeLabel[] {
  const qualityLabels = gPlayerResponse.streamingData.adaptiveFormats.map(format => format.quality);
  return [...new Set(qualityLabels)] as YouTubeLabel[];
}

async function changeQualityOnMobile(qualityCustom?: VideoQuality): Promise<void> {
  const fpsVideo = getVideoFPS();
  const qualitiesAvailable = getCurrentQualities();
  const qualitiesPreferred = await getPreferredQualities();
  const fpsStep = getFpsFromRange(qualitiesPreferred, fpsVideo);
  const qualityPreferred = qualityCustom || qualitiesPreferred[fpsStep];

  const applyQuality = async (iQuality: number): Promise<void> => {
    const elDropdown = (await getElementByMutationObserver(SELECTORS.mobileQualityDropdown)) as HTMLSelectElement;
    if (elDropdown) {
      elDropdown.value = qualitiesAvailable[iQuality];
      elDropdown.dispatchEvent(EVENT);
    }
  };

  const iQualityPreferred = qualitiesAvailable.findIndex(
    (label: YouTubeLabel) => labelToQuality[label] === qualityPreferred
  );
  if (iQualityPreferred > -1) {
    await applyQuality(iQualityPreferred);
    return;
  }

  await applyQuality(0);
}

async function getPlayerResponse(): Promise<object> {
  return fetch(location.href)
    .then(response => response.text())
    .then(textContent => {
      const regex = /ytInitialPlayerResponse = ({.+?});(?:var meta|<\/script|\n)/;
      return JSON.parse(textContent.match(regex)[1]);
    });
}

async function openMenu(): Promise<void> {
  const elMenuButton = document.querySelector<HTMLButtonElement>(SELECTORS.mobileMenuButton);
  if (elMenuButton) {
    elMenuButton.click();
  }
}

export async function prepareToChangeQualityOnMobile(e?: Event): Promise<void> {
  // Removing the event so that the menu will only be opened once
  const elVideo = e?.target as HTMLVideoElement;
  elVideo?.removeEventListener("canplay", prepareToChangeQualityOnMobile);

  // Changing the quality
  gPlayerResponse = await getPlayerResponse();
  await openMenu();
  await changeQualityOnMobile(window.ythdLastQualityClicked);
  document.querySelector<HTMLButtonElement>(SELECTORS.mobileOkButton).click();
}

const storageLocal = new Storage({ area: "local" });
storageLocal.watch({
  async qualities({ newValue: qualities }: { newValue: QualityFpsPreferences }) {
    window.ythdLastQualityClicked = null;
    window.ythdLastUserQualities = { ...qualities };
    await prepareToChangeQualityOnMobile();
  }
});
