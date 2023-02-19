import { Storage } from "@plasmohq/storage";

import {
  getFpsFromRange,
  getIQuality,
  getPreferredQualities,
  getVisibleElement,
  OBSERVER_OPTIONS,
  SELECTORS
} from "~shared-scripts/ythd-utils";
import type { FullYouTubeLabel, QualityFpsPreferences, VideoFPS, VideoQuality } from "~types";

const storageLocal = new Storage({ area: "local" });

function getPlayerDiv(elVideo: HTMLVideoElement): HTMLDivElement {
  return elVideo.closest(SELECTORS.player);
}

function getIsQualityLower(elQuality: HTMLElement, qualityPreferred: VideoQuality): boolean {
  if (!elQuality) {
    return true;
  }
  const labelQuality = elQuality.textContent as FullYouTubeLabel;
  const qualityVideo = parseInt(labelQuality) as VideoQuality;
  return qualityVideo < qualityPreferred;
}

function getIsLastOptionQuality(elVideo: HTMLVideoElement): boolean {
  const elOptionInSettings = getPlayerDiv(elVideo).querySelector(SELECTORS.optionQuality);
  if (!elOptionInSettings) {
    return false;
  }

  const elQualityName = elOptionInSettings.querySelector<HTMLDivElement>(SELECTORS.menuOptionContent);

  // If the video is a channel trailer, the last option is initially the speed one,
  // and the speed setting can only be a single digit
  const matchNumber = elQualityName?.textContent?.match(/\d+/);
  if (!matchNumber) {
    return false;
  }
  const numberString = matchNumber[0] as FullYouTubeLabel;
  const minQualityCharLength = 3; // e.g. 3 characters in 720p
  return numberString.length >= minQualityCharLength;
}

function getIsQualityElement(element: HTMLDivElement): boolean {
  const isQuality = Boolean(element.textContent.match(/\d/));
  const isHasChildren = element.children.length > 1;
  return isQuality && !isHasChildren;
}

function getCurrentQualityElements(): HTMLDivElement[] {
  const elMenuOptions = [...getVisibleElement(SELECTORS.player).querySelectorAll(SELECTORS.menuOption)];
  return elMenuOptions.filter(getIsQualityElement) as HTMLDivElement[];
}

function convertQualityToNumber(elQuality: Element): VideoQuality {
  return parseInt(elQuality.textContent) as VideoQuality;
}

function getCurrentQualities(): VideoQuality[] {
  const elQualities = getCurrentQualityElements();
  return elQualities.map(convertQualityToNumber);
}

function getVideoFPS(): VideoFPS {
  const elQualities = getCurrentQualityElements();
  const labelQuality = elQualities[0]?.textContent as FullYouTubeLabel;
  if (!labelQuality) {
    return 30;
  }
  const fpsMatch = labelQuality.match(/[ps](\d+)/);
  return fpsMatch ? (Number(fpsMatch[1]) as VideoFPS) : 30;
}

function openQualityMenu(elVideo: HTMLVideoElement): void {
  const elSettingQuality = getPlayerDiv(elVideo).querySelector<HTMLDivElement>(SELECTORS.optionQuality);
  elSettingQuality.click();
}

function changeQuality(qualityCustom?: VideoQuality): void {
  const fpsVideo = getVideoFPS();
  const qualitiesAvailable = getCurrentQualities();
  const elQualities = getCurrentQualityElements();
  const fpsStep = getFpsFromRange(window.ythdLastUserQualities, fpsVideo);
  const iQuality = getIQuality(qualitiesAvailable, qualityCustom || window.ythdLastUserQualities[fpsStep]);

  const applyQuality = (iQuality: number): void => {
    elQualities[iQuality]?.click();
  };

  const isQualityExists = iQuality > -1;
  if (isQualityExists) {
    applyQuality(iQuality);
  } else if (getIsQualityLower(elQualities[0], window.ythdLastUserQualities[fpsStep])) {
    applyQuality(0);
  } else {
    const iClosestQuality = qualitiesAvailable.findIndex(quality => quality <= window.ythdLastUserQualities[fpsStep]);
    const isClosestQualityFound = iClosestQuality > -1;
    if (isClosestQualityFound) {
      applyQuality(iClosestQuality);
    }
  }
}

function changeQualityWhenPossible(elVideo: HTMLVideoElement): void {
  if (!getIsLastOptionQuality(elVideo)) {
    elVideo.addEventListener("canplay", () => changeQualityWhenPossible(elVideo), { once: true });
    return;
  }

  openQualityMenu(elVideo);
  changeQuality(window.ythdLastQualityClicked);
}

function getIsSettingsMenuOpen(): boolean {
  const elButtonSettings = getVisibleElement<HTMLButtonElement>(SELECTORS.buttonSettings);
  return elButtonSettings?.ariaExpanded === "true";
}

async function closeMenu(elPlayer: HTMLDivElement): Promise<void> {
  const clickPanelBackIfPossible = (): boolean => {
    const elPanelHeaderBack = elPlayer.querySelector<HTMLButtonElement>(SELECTORS.panelHeaderBack);
    if (elPanelHeaderBack) {
      elPanelHeaderBack.click();
      return true;
    }
    return false;
  };

  if (clickPanelBackIfPossible()) {
    return;
  }

  new MutationObserver((_, observer) => {
    if (clickPanelBackIfPossible()) {
      observer.disconnect();
    }
  }).observe(elPlayer, OBSERVER_OPTIONS);
}

async function changeQualityAndClose(elVideo: HTMLVideoElement, elPlayer: HTMLDivElement): Promise<void> {
  changeQualityWhenPossible(elVideo);
  await closeMenu(elPlayer);
}

export async function prepareToChangeQualityOnDesktop(e?: Event): Promise<void> {
  window.ythdLastUserQualities = await getPreferredQualities();

  const elVideo = (e?.target ?? getVisibleElement(SELECTORS.video)) as HTMLVideoElement;
  const elPlayer = getPlayerDiv(elVideo);
  const elSettings = elPlayer.querySelector<HTMLButtonElement>(SELECTORS.buttonSettings);

  if (!elSettings) {
    return;
  }

  if (!getIsSettingsMenuOpen()) {
    elSettings.click();
  }
  elSettings.click();
  await changeQualityAndClose(elVideo, elPlayer);

  elPlayer.querySelector<HTMLButtonElement>(SELECTORS.buttonSettings).blur();
}

storageLocal.watch({
  async qualities({ newValue: qualities }: { newValue: QualityFpsPreferences }) {
    window.ythdLastQualityClicked = null;
    window.ythdLastUserQualities = { ...qualities };
    await prepareToChangeQualityOnDesktop();
  }
});
