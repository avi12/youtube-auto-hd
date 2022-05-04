"use strict";

import {
  getFpsFromRange, getIQuality, getIsQualityLower,
  getPreferredQualities,
  getStorage,
  getVisibleElement,
  Selectors
} from "../shared-scripts/ythd-utilities";
import type { FpsList, QualityLabels, VideoQuality, VideoSize } from "../types";
import { resizePlayerIfNeeded } from "./ythd-content-script-resize";
import { prepareToChangeQualityOnMobile } from "./ythd-content-script-functions-mobile";

const gIsMobile = location.hostname.startsWith("m.");

function getIsLastOptionQuality() {
  const elOptionInSettings = getVisibleElement("player").querySelector(Selectors.optionQuality);
  if (!elOptionInSettings) {
    return false;
  }

  const elQualityName = elOptionInSettings.querySelector<HTMLDivElement>(Selectors.menuOptionContent);

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

function getIsQualityElement(element: HTMLDivElement): boolean {
  const isQuality = Boolean(element.textContent.match(/\d/));
  const isHasChildren = element.children.length > 1;
  return isQuality && !isHasChildren;
}

function getCurrentQualityElements(): HTMLDivElement[] {
  const elMenuOptions = [...getVisibleElement("player").querySelectorAll(Selectors.menuOption)];
  return elMenuOptions.filter(getIsQualityElement) as HTMLDivElement[];
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
  const elSettingQuality = getVisibleElement("player").querySelector<HTMLDivElement>(Selectors.optionQuality);
  elSettingQuality.click();
}

async function changeQuality(qualityCustom?: VideoQuality): Promise<void> {
  const fpsVideo = getVideoFPS();
  const qualitiesAvailable = getCurrentQualities();
  const elQualities = getCurrentQualityElements();
  const qualitiesPreferred = await getPreferredQualities();

  const fpsStep = await getFpsFromRange(qualitiesPreferred, fpsVideo);
  const iQuality = getIQuality(qualitiesAvailable, qualityCustom || qualitiesPreferred[fpsStep]);

  const applyQuality = (iQuality: number) => {
    elQualities[iQuality]?.click();
  };

  const isQualityExists = iQuality > -1;
  if (isQualityExists) {
    applyQuality(iQuality);
  } else if (getIsQualityLower(elQualities[0], qualitiesPreferred[fpsStep])) {
    applyQuality(0);
  } else {
    const iClosestQuality = qualitiesAvailable.findIndex(quality => quality <= qualitiesPreferred[fpsStep]);
    const isClosestQualityFound = iClosestQuality > -1;
    if (isClosestQualityFound) {
      applyQuality(iClosestQuality);
    }
  }
}

async function changeQualityWhenPossible(): Promise<void> {
  const elVideo = getVisibleElement<HTMLVideoElement>("video");
  if (!getIsLastOptionQuality()) {
    elVideo.addEventListener("canplay", changeQualityWhenPossible, { once: true });
    return;
  }

  openQualityMenu();
  await changeQuality(window.ythdLastQualityClicked);
}

function getIsSettingsMenuOpen(): boolean {
  const elButtonSettings = getVisibleElement<HTMLButtonElement>("buttonSettings");
  return elButtonSettings?.ariaExpanded === "true";
}

function closeMenu(elPlayer: HTMLDivElement) {
  const elPanelHeader = elPlayer.querySelector<HTMLButtonElement>(Selectors.panelHeader);
  elPanelHeader?.click();
}

async function changeQualityAndClose(elPlayer: HTMLDivElement): Promise<void> {
  await changeQualityWhenPossible();
  closeMenu(elPlayer);
}

function getIsMenuOpen(elPlayer: HTMLDivElement): boolean {
  const elPanelHeader = elPlayer.querySelector<HTMLButtonElement>(Selectors.panelHeader);
  return Boolean(elPanelHeader);
}

export async function prepareToChangeQuality(): Promise<void> {
  if (gIsMobile) {
    await prepareToChangeQualityOnMobile();
    return;
  }

  const elPlayer = getVisibleElement<HTMLDivElement>("player");
  const elSettings = elPlayer.querySelector<HTMLButtonElement>(Selectors.buttonSettings);
  if (!elSettings) {
    return;
  }

  if (getIsMenuOpen(elPlayer)) {
    await changeQualityAndClose(elPlayer);
    return;
  }

  if (!getIsSettingsMenuOpen()) {
    elSettings.click();
  }
  elSettings.click();
  await changeQualityAndClose(elPlayer);
}

chrome.storage.onChanged.addListener(async ({ qualities, autoResize, size }) => {
  if (qualities) {
    window.ythdLastQualityClicked = null;
    window.ythdLastUserQualities = { ...qualities.newValue };
    await prepareToChangeQuality();
    return;
  }

  if (autoResize && autoResize.newValue) {
    const sizeVideo = await getStorage<VideoSize>("sync", "size");
    await resizePlayerIfNeeded(sizeVideo);
    return;
  }

  if (size !== undefined) {
    const sizeNew = size.newValue as VideoSize;
    await resizePlayerIfNeeded(sizeNew);
  }
});
