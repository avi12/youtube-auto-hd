import { fpsSupported, qualities } from "@/lib/ythd-defaults";
import {
  type EnhancedBitratePreferences,
  type EnhancedVideoQuality,
  SUFFIX_EBR,
  SUFFIX_SUPER_RESOLUTION,
  type VideoQuality
} from "@/lib/ythd-types";
import {
  getFpsFromRange,
  getPlayerDiv,
  getStorage,
  getVisibleElement,
  OBSERVER_OPTIONS,
  SELECTORS
} from "@/lib/ythd-utils";

function getQualityMenuRowV3(elPlayer: HTMLDivElement) {
  const rows = [...elPlayer.querySelectorAll(SELECTORS.qualityMenuRowV3)];
  return rows.find(row => row.querySelector(SELECTORS.qualityMenuTitleV3)?.textContent?.match(/quality/i)) ?? null;
}

function getIsLastOptionQuality(elVideo: HTMLVideoElement) {
  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return false;
  }

  const elOptionInSettings = elPlayer.querySelector(SELECTORS.optionQuality);
  if (elOptionInSettings) {
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

  // V3/VORAPIS fallback
  return Boolean(getQualityMenuRowV3(elPlayer));
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

  const modernElements = [...elPlayer.querySelectorAll<HTMLDivElement>(SELECTORS.menuOption)].filter(getIsQualityElement);
  if (modernElements.length > 0) {
    return modernElements;
  }

  // V3/VORAPIS fallback
  const qualityRow = getQualityMenuRowV3(elPlayer);
  return qualityRow ? [...qualityRow.querySelectorAll<HTMLDivElement>(SELECTORS.qualityOptionV3)] : [];
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
  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return;
  }

  const elSettingQuality = elPlayer.querySelector<HTMLDivElement>(SELECTORS.optionQuality);
  if (elSettingQuality) {
    elSettingQuality.click();
    return;
  }

  // V3/VORAPIS fallback: expand the quality dropdown
  getQualityMenuRowV3(elPlayer)?.querySelector<HTMLElement>(SELECTORS.qualityDropDownTriggerV3)?.click();
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

  // V3/VORAPIS: close the settings panel via the settings button
  if (elPlayer.querySelector(SELECTORS.qualityMenuRowV3)) {
    elPlayer.querySelector<HTMLButtonElement>(SELECTORS.buttonSettings)?.click();
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
    fallback: window.ythdLastUserQualities
  });
  window.ythdLastUserEnhancedBitrates = await getStorage({
    area: "local",
    key: "isEnhancedBitrates",
    fallback: window.ythdLastUserEnhancedBitrates
  });
  window.ythdIsUseSuperResolution = await getStorage({
    area: "local",
    key: "isUseSuperResolution",
    fallback: window.ythdIsUseSuperResolution
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
