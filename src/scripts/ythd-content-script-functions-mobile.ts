import {
  getElementByMutationObserver,
  getFpsFromRange,
  getIQuality,
  getPreferredQualities,
  getVisibleElement,
  Selectors
} from "../shared-scripts/ythd-utilities";
import type { FpsList, Label, VideoQuality } from "../types";
import { labelToQuality, qualities } from "../shared-scripts/ythd-setup";

let gPlayerResponse;
const gEvent = new Event("change", { bubbles: true });

function getVideoFPS(): FpsList {
  return gPlayerResponse.streamingData.adaptiveFormats[0].fps as FpsList;
}

function getCurrentQualities(): Label[] {
  return [...new Set(gPlayerResponse.streamingData.adaptiveFormats.map(format => format.quality))] as Label[];
}

function getIsMobileQualityLower(quality1: Label, quality2: typeof qualities[number]): boolean {
  return labelToQuality[quality1] < quality2;
}

async function changeQualityOnMobile(qualityCustom?: VideoQuality): Promise<void> {
  const fpsVideo = getVideoFPS();
  const qualitiesAvailable = getCurrentQualities();
  const qualitiesPreferred = await getPreferredQualities();

  const fpsStep = getFpsFromRange(qualitiesPreferred, fpsVideo);
  const iQuality = getIQuality(qualitiesAvailable, qualityCustom || qualitiesPreferred[fpsStep]);

  const applyQuality = async (iQuality: number) => {
    const elDropdown = (await getElementByMutationObserver("mobileQualityDropdown")) as HTMLSelectElement;
    if (elDropdown) {
      elDropdown.value = qualitiesAvailable[iQuality];
      elDropdown.dispatchEvent(gEvent);
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

async function getPlayerResponse() {
  return fetch(location.href)
    .then(response => response.text())
    .then(textContent => {
      const regex = /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script|\n)/;
      return JSON.parse(textContent.match(regex)[1]);
    });
}

chrome.storage.onChanged.addListener(async ({ qualities }) => {
  if (qualities) {
    window.ythdLastQualityClicked = null;
    window.ythdLastUserQualities = { ...qualities.newValue };
    await prepareToChangeQualityOnMobile();
    return;
  }
});

async function clickPlaybackSettings() {
  await getElementByMutationObserver("mobileOption");
  const elMenuOptions = document.querySelectorAll(Selectors.mobileOption);
  const elPlaybackSettings = <HTMLButtonElement>elMenuOptions[elMenuOptions.length - 5].firstElementChild;
  elPlaybackSettings.click();
}

async function openMenu() {
  const elMenuButton = getVisibleElement("mobileMenuButton");
  if (elMenuButton) {
    elMenuButton.click();
    return;
  }

  (await getElementByMutationObserver("mobileMenuButton")).click();
}

export async function prepareToChangeQualityOnMobile(): Promise<void> {
  gPlayerResponse = await getPlayerResponse();
  await openMenu();
  await clickPlaybackSettings();
  await changeQualityOnMobile(window.ythdLastQualityClicked);
  getVisibleElement("mobileOkButton").click();
}