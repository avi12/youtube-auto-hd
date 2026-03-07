import { fpsSupported, initial, qualities } from "@/lib/ythd-defaults";
import {
  type EnhancedBitratePreferences,
  type EnhancedVideoQuality,
  SUFFIX_EBR,
  SUFFIX_SUPER_RESOLUTION,
  type VideoQuality
} from "@/lib/ythd-types";
import { getFpsFromRange, getPlayerDiv, getStorage, getVisibleElement, OBSERVER_OPTIONS, SELECTORS } from "@/lib/ythd-utils";

function getIsLastOptionQuality(elVideo: HTMLVideoElement) {
  const elOptionInSettings = getPlayerDiv(elVideo)?.querySelector(SELECTORS.optionQuality);
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
  const minQualityCharLength = 3; // e.g. 3 characters in 720p
  return matchNumber[0].length >= minQualityCharLength;
}

function getIsQualityElement(element: Element) {
  const isQuality = Boolean(element.textContent?.match(/\d/));
  const isHasChildren = element.children.length > 1;
  return isQuality && !isHasChildren;
}

function getCurrentQualityElements(elVideo: HTMLVideoElement) {
  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return [];
  }
  return [...elPlayer.querySelectorAll<HTMLDivElement>(SELECTORS.menuOption)].filter(getIsQualityElement);
}

function convertQualityToNumber(elQuality: Element) {
  const isRegularQuality = !elQuality.querySelector(SELECTORS.labelPremium);
  const qualityNumber = qualities.find(quality => quality === parseInt(elQuality.textContent ?? ""));
  if (!qualityNumber) {
    return undefined;
  }
  if (isRegularQuality) {
    return qualityNumber;
  }
  const isPremiumQuality = elQuality.textContent?.match(/premium/i);
  if (isPremiumQuality) {
    return `${qualityNumber}${SUFFIX_EBR}`;
  }
  return `${qualityNumber}${SUFFIX_SUPER_RESOLUTION}`;
}

function getAvailableQualities(elVideo: HTMLVideoElement) {
  const elQualities = getCurrentQualityElements(elVideo);
  return elQualities.map(convertQualityToNumber).filter(quality => quality !== undefined);
}

function getVideoFPS(elVideo: HTMLVideoElement) {
  const elQualities = getCurrentQualityElements(elVideo);
  const labelQuality = elQualities[0]?.textContent;
  if (!labelQuality) {
    return 30;
  }
  const fpsMatch = labelQuality.match(/[ps](\d+)/);
  return fpsMatch ? fpsSupported.find(fps => fps === Number(fpsMatch[1])) ?? 30 : 30;
}

function openQualityMenu(elVideo: HTMLVideoElement) {
  const elSettingQuality = getPlayerDiv(elVideo)?.querySelector<HTMLDivElement>(SELECTORS.optionQuality);
  elSettingQuality?.click();
}

function changeQuality(
  elVideo: HTMLVideoElement,
  qualityCustom?: VideoQuality | EnhancedVideoQuality,
  isEnhancedBitrateCustom?: Partial<EnhancedBitratePreferences>,
  isUseSuperResolution?: boolean
) {
  if (!window.ythdLastUserQualities) {
    return;
  }

  const fpsVideo = getVideoFPS(elVideo);
  const fpsStep = getFpsFromRange(window.ythdLastUserQualities, fpsVideo);
  const elQualities = getCurrentQualityElements(elVideo);
  const qualitiesAvailable = getAvailableQualities(elVideo);
  const qualityPreferred = qualityCustom || window.ythdLastUserQualities[fpsStep];
  const isEnhancedBitrate = { ...window.ythdLastUserEnhancedBitrates, ...isEnhancedBitrateCustom };

  const applyQuality = (iQuality: number) => {
    elQualities[iQuality]?.click();
  };

  const isQualityPreferredEBR = qualitiesAvailable[0]?.toString().endsWith(SUFFIX_EBR) && isEnhancedBitrate[fpsStep];
  if (isQualityPreferredEBR) {
    applyQuality(0);
    return;
  }

  const iQualityPreferred = qualitiesAvailable.findIndex(quality => {
    const qualityLabel = quality.toString();
    const qualityNumber = parseInt(qualityLabel);

    if (qualityLabel.endsWith(SUFFIX_EBR) && !isEnhancedBitrate[fpsStep]) {
      return false;
    }

    if (qualityLabel.endsWith(SUFFIX_SUPER_RESOLUTION) && !isUseSuperResolution) {
      return false;
    }

    return qualityNumber <= parseInt(qualityPreferred.toString());
  });

  if (iQualityPreferred > -1) {
    applyQuality(iQualityPreferred);
    return;
  }

  const iLastQuality = qualitiesAvailable.length - 1;
  applyQuality(iLastQuality);
}

function changeQualityWhenPossible(elVideo: HTMLVideoElement) {
  if (!getIsLastOptionQuality(elVideo)) {
    return false;
  }

  openQualityMenu(elVideo);
  changeQuality(
    elVideo,
    window.ythdLastQualityClicked,
    window.ythdLastEnhancedBitrateClicked,
    window.ythdIsUseSuperResolution
  );
  return true;
}

function getIsSettingsMenuOpen() {
  const elButtonSettings = getVisibleElement<HTMLButtonElement>(SELECTORS.buttonSettings);
  return elButtonSettings?.ariaExpanded === "true";
}

function closeMenu(elPlayer: HTMLDivElement) {
  const clickPanelBackIfPossible = () => {
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

function changeQualityAndClose(elVideo: HTMLVideoElement, elPlayer: HTMLDivElement) {
  const qualityWasSet = changeQualityWhenPossible(elVideo);
  if (qualityWasSet) {
    closeMenu(elPlayer);
  }
}

export async function prepareToChangeQualityOnDesktop(e?: Event) {
  if (location.pathname.startsWith("/shorts/")) {
    return;
  }

  window.ythdLastUserQualities = await getStorage({
    area: "local",
    key: "qualities",
    fallback: initial.qualities
  });
  window.ythdLastUserEnhancedBitrates = await getStorage({
    area: "local",
    key: "isEnhancedBitrates",
    fallback: initial.isEnhancedBitrates
  });
  window.ythdIsUseSuperResolution = await getStorage({
    area: "local",
    key: "isUseSuperResolution",
    fallback: initial.isUseSuperResolution
  });

  const elVideo = e?.target ?? getVisibleElement(SELECTORS.video);
  if (!(elVideo instanceof HTMLVideoElement)) {
    return;
  }

  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return;
  }

  const elSettings = elPlayer.querySelector<HTMLButtonElement>(SELECTORS.buttonSettings);
  if (!elSettings) {
    return;
  }

  if (!getIsSettingsMenuOpen()) {
    elSettings.click();
  }
  elSettings.click();
  changeQualityAndClose(elVideo, elPlayer);

  elPlayer.querySelector<HTMLButtonElement>(SELECTORS.buttonSettings)?.blur();
}
