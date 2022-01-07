"use strict";

import { getElement, getElements, getStorage } from "../shared-scripts/ythd-utilities";
import { initial } from "../shared-scripts/ythd-setup";
import type { FpsList, FpsOptions, QualityLabels, VideoQuality } from "../types";

let gLastUserQualities: FpsOptions = { ...initial.qualities };

function getIsQualityLower(
  elQuality: HTMLDivElement | undefined,
  qualityPreferred: VideoQuality
): boolean {
  if (!elQuality) {
    return true;
  }
  const labelQuality = elQuality.textContent as QualityLabels;
  const qualityVideo = parseInt(labelQuality) as VideoQuality;
  return qualityVideo < qualityPreferred;
}

function getIQuality(qualitiesCurrent: VideoQuality[], qualityPreferred: VideoQuality): number {
  return qualitiesCurrent.findIndex(elQuality => elQuality === qualityPreferred);
}

function getFpsFromRange(qualities: FpsOptions, fpsToCheck: FpsList): FpsList {
  const fpsList = Object.keys(qualities)
    .map(Number)
    .sort((a, b) => b - a) as FpsList[];
  while (fpsList.length > 1) {
    const fpsCurrent = fpsList.pop() as FpsList;
    if (fpsToCheck <= fpsCurrent) {
      return fpsCurrent;
    }
  }
  return fpsList[0];
}

export async function getPreferredQualities(): Promise<FpsOptions> {
  try {
    const userQualities: FpsOptions = (await getStorage("local", "qualities")) ?? {};
    gLastUserQualities = { ...initial.qualities, ...userQualities };
    return gLastUserQualities;
  } catch {
    // Handling "Error: Extension context invalidated"

    // This error typically occurs when the extension updates
    // but the user hasn't refreshed the page, which typically causes
    // the player settings to open when seeking through a video
    return gLastUserQualities;
  }
}

function getIsLastOptionQuality() {
  const elOptionInSettings = getElement("optionQuality") as HTMLDivElement;
  if (!elOptionInSettings) {
    return false;
  }

  const selQualityName = ".ytp-menuitem-content";
  const elQualityName = elOptionInSettings.querySelector(selQualityName);

  // If the video is a channel trailer, the last option is initially the speed one,
  // and the speed setting can only be a single digit
  const matchNumber = elQualityName?.textContent?.match(/\d+/);
  if (!matchNumber) {
    return false;
  }
  const numberString = matchNumber[0] as QualityLabels;
  const minQualityCharLength = 3; // e.g. 3 characters in 720p
  return numberString.length >= minQualityCharLength;
}

function isQualityElement(element: HTMLDivElement): boolean {
  const isQuality = Boolean(element.textContent.match(/\d/));
  const isHasChildren = element.children.length > 1;
  return isQuality && !isHasChildren;
}

function getCurrentQualityElements(): HTMLDivElement[] {
  return getElements("menuOption").filter(isQualityElement) as HTMLDivElement[];
}

function convertQualityToNumber(elQuality: Element): VideoQuality {
  return parseInt(elQuality.textContent) as VideoQuality;
}

function getCurrentQualities(): VideoQuality[] {
  const elQualities = getCurrentQualityElements();
  return elQualities.map(convertQualityToNumber);
}

function getVideoFPS(): FpsList {
  const elQualities = getCurrentQualityElements();
  const labelQuality = elQualities[0]?.textContent as QualityLabels;
  if (!labelQuality) {
    return 30;
  }
  const fpsMatch = labelQuality.match(/[ps](\d+)/);
  return fpsMatch ? (Number(fpsMatch[1]) as FpsList) : 30;
}

function openQualityMenu(): void {
  const elSettingQuality = getElement("optionQuality") as HTMLDivElement;
  elSettingQuality.click();
}

async function changeQuality(qualityCustom?: VideoQuality): Promise<void> {
  const fpsVideo = getVideoFPS();
  const qualitiesAvailable = getCurrentQualities();
  const elQualities = getCurrentQualityElements();
  const qualitiesPreferred = await getPreferredQualities();

  const fpsStep = await getFpsFromRange(qualitiesPreferred, fpsVideo);
  const iQuality = getIQuality(qualitiesAvailable, qualityCustom || qualitiesPreferred[fpsStep]);

  const isQualityExists = iQuality > -1;
  if (isQualityExists) {
    elQualities[iQuality].click();
  } else if (getIsQualityLower(elQualities[0], qualitiesPreferred[fpsStep])) {
    elQualities[0].click();
  } else {
    const iClosestQuality = qualitiesAvailable.findIndex(
      quality => quality <= qualitiesPreferred[fpsStep]
    );
    const isClosestQualityFound = iClosestQuality > -1;
    if (isClosestQualityFound) {
      elQualities[iClosestQuality].click();
    } else {
      toggleSettingsMenu();
    }
  }
}

async function changeQualityWhenPossible(): Promise<void> {
  const elVideo = getElement("video") as HTMLVideoElement;
  if (!getIsLastOptionQuality()) {
    elVideo.addEventListener("canplay", changeQualityWhenPossible, { once: true });
    requestAnimationFrame(() => {
      toggleSettingsMenu();
    });
    return;
  }

  openQualityMenu();

  await changeQuality(window.ythdLastQualityClicked);
  const elButtonSettings = getElement("buttonSettings") as HTMLButtonElement;
  if (document.activeElement === elButtonSettings) {
    elButtonSettings.blur();
  }
  elVideo.focus();
}

function toggleSettingsMenu(): void {
  const elButtonSettings = getElement("buttonSettings") as HTMLButtonElement;
  elButtonSettings?.click();
}

function getIsSettingsMenuOpen(): boolean {
  const elButtonSettings = getElement("buttonSettings") as HTMLButtonElement;
  return elButtonSettings.ariaExpanded === "true";
}

export async function onSettingsMenuOpen({ isTrusted }: MouseEvent): Promise<void> {
  if (!isTrusted) {
    await changeQualityWhenPossible();
  }
}

export function prepareToChangeQuality(): void {
  console.log("prepareToChangeQuality");
  const elSettings = getElement("buttonSettings");
  if (!elSettings) {
    return;
  }

  elSettings.addEventListener("click", onSettingsMenuOpen, { once: true });

  if (!getIsSettingsMenuOpen()) {
    toggleSettingsMenu();
  }
}

chrome.storage.onChanged.addListener(async ({ qualities }) => {
  if (qualities) {
    window.ythdLastQualityClicked = null;
    gLastUserQualities = { ...qualities.newValue };
    await prepareToChangeQuality();
    return;
  }
});
