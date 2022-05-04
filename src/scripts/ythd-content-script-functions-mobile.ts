import {
  getElementByMutationObserver,
  getFpsFromRange,
  getIQuality,
  getPreferredQualities,
  getVisibleElement
} from "../shared-scripts/ythd-utilities";
import type { FpsList, Label, VideoQuality } from "../types";
import { labelToQuality, qualities } from "../shared-scripts/ythd-setup";

let gPlayerResponse;
async function getVideoFPS(): Promise<FpsList> {
  return gPlayerResponse.streamingData.adaptiveFormats[0].fps as FpsList;
}

function getCurrentQualities(): Label[] {
  return [...new Set(gPlayerResponse.streamingData.adaptiveFormats.map(format => format.quality))] as Label[];
}

function getIsMobileQualityLower(quality1: Label, quality2: typeof qualities[number]): boolean {
  return labelToQuality[quality1] < quality2;
}

async function changeQuality(qualityCustom?: VideoQuality): Promise<void> {
  const fpsVideo = await getVideoFPS();
  const qualitiesAvailable = getCurrentQualities();
  const qualitiesPreferred = await getPreferredQualities();

  const fpsStep = await getFpsFromRange(qualitiesPreferred, fpsVideo);
  const iQuality = getIQuality(qualitiesAvailable, qualityCustom || qualitiesPreferred[fpsStep]);

  const applyQuality = (iQuality: number) => {
    const elDropdown = getVisibleElement<HTMLSelectElement>("mobileQualityDropdown");
    elDropdown.value = qualitiesAvailable[iQuality];
    elDropdown.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const isQualityExists = iQuality > -1;
  if (isQualityExists) {
    applyQuality(iQuality);
  } else if (getIsMobileQualityLower(qualitiesAvailable[0], qualitiesPreferred[fpsStep])) {
    applyQuality(0);
  } else {
    const iClosestQuality = qualitiesAvailable.findIndex(
      quality => labelToQuality[quality] <= qualitiesPreferred[fpsStep]
    );
    const isClosestQualityFound = iClosestQuality > -1;
    if (isClosestQualityFound) {
      applyQuality(iClosestQuality);
    }
  }
}

async function getPlayerResponse() {
  return fetch(location.href)
    .then(response => response.text())
    .then(textContent => {
      const regex = /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script|\n)/;
      return JSON.parse(textContent.match(regex)[1]);
    });
}

export async function prepareToChangeQualityOnMobile(): Promise<void> {
  gPlayerResponse = await getPlayerResponse();
  await getElementByMutationObserver("mobileUnmute");
  getVisibleElement("mobileUnmute").click();
  getVisibleElement("mobileButtonSettings").click();
  await getElementByMutationObserver("mobileQualityDropdown");
  await changeQuality();
  getVisibleElement("mobileOkButton").click();
  getVisibleElement("mobilePlayerControlsBackground").click();
}
