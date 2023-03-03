import { Storage } from "@plasmohq/storage";

import { labelToQuality, qualities } from "~shared-scripts/ythd-setup";
import {
  SELECTORS,
  getElementByMutationObserver,
  getFpsFromRange,
  getIQuality,
  getPreferredQualities,
  getVisibleElement
} from "~shared-scripts/ythd-utils";
import type { QualityFpsPreferences, VideoFPS, VideoQuality, YouTubeLabel } from "~types";

let gPlayerResponse;
const EVENT = new Event("change", { bubbles: true });

function getVideoFPS(): VideoFPS {
  return gPlayerResponse.streamingData.adaptiveFormats[0].fps;
}

function getCurrentQualities(): YouTubeLabel[] {
  const qualityLabels: YouTubeLabel[] = gPlayerResponse.streamingData.adaptiveFormats.map(format => format.quality);
  return [...new Set(qualityLabels)];
}

function getIsMobileQualityLower(quality1: YouTubeLabel, quality2: typeof qualities[number]): boolean {
  return labelToQuality[quality1] < quality2;
}

async function changeQualityOnMobile(qualityCustom?: VideoQuality): Promise<void> {
  const fpsVideo = getVideoFPS();
  const qualitiesAvailable = getCurrentQualities();
  const qualitiesPreferred = await getPreferredQualities();

  const fpsStep = getFpsFromRange(qualitiesPreferred, fpsVideo);
  const iQuality = getIQuality(qualitiesAvailable, qualityCustom || qualitiesPreferred[fpsStep]);

  const applyQuality = async (iQuality: number): Promise<void> => {
    const elDropdown = (await getElementByMutationObserver(SELECTORS.mobileQualityDropdown)) as HTMLSelectElement;
    if (elDropdown) {
      elDropdown.value = qualitiesAvailable[iQuality];
      elDropdown.dispatchEvent(EVENT);
    }
  };

  const isQualityExists = iQuality > -1;
  if (isQualityExists) {
    await applyQuality(iQuality);
  } else if (getIsMobileQualityLower(qualitiesAvailable[0], qualitiesPreferred[fpsStep])) {
    await applyQuality(0);
  } else {
    const iClosestQuality = qualitiesAvailable.findIndex(
      quality => labelToQuality[quality] <= qualitiesPreferred[fpsStep]
    );
    const isClosestQualityFound = iClosestQuality > -1;
    if (isClosestQualityFound) {
      await applyQuality(iClosestQuality);
    }
  }
}

async function getPlayerResponse(): Promise<object> {
  return fetch(location.href)
    .then(response => response.text())
    .then(textContent => {
      const regex = /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script|\n)/;
      return JSON.parse(textContent.match(regex)[1]);
    });
}

async function clickPlaybackSettings(): Promise<void> {
  await getElementByMutationObserver(SELECTORS.mobileOption);
  const elMenuOptions = document.querySelectorAll(SELECTORS.mobileOption);
  const elPlaybackSettings = elMenuOptions[elMenuOptions.length - 5].firstElementChild as HTMLButtonElement;
  elPlaybackSettings.click();
}

async function openMenu(): Promise<void> {
  const elMenuButton = getVisibleElement(SELECTORS.mobileMenuButton);
  if (elMenuButton) {
    elMenuButton.click();
    return;
  }

  (await getElementByMutationObserver(SELECTORS.mobileMenuButton)).click();
}

export async function prepareToChangeQualityOnMobile(e?: Event): Promise<void> {
  // Removing the event so that the menu will only be opened once
  const elVideo = e?.target as HTMLVideoElement;
  elVideo?.removeEventListener("canplay", prepareToChangeQualityOnMobile);

  // Changing the quality
  gPlayerResponse = await getPlayerResponse();
  await openMenu();
  await clickPlaybackSettings();
  await changeQualityOnMobile(window.ythdLastQualityClicked);
  getVisibleElement(SELECTORS.mobileOkButton).click();
}

const storageSync = new Storage({ area: "sync" });
storageSync.watch({
  async qualities({ newValue: qualities }: { newValue: QualityFpsPreferences }) {
    window.ythdLastQualityClicked = null;
    window.ythdLastUserQualities = { ...qualities };
    await prepareToChangeQualityOnMobile();
  }
});
