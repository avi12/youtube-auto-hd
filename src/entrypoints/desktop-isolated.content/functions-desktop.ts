import { logDebug } from "@/lib/ythd-debug";
import { qualities } from "@/lib/ythd-defaults";
import { loadStorageValues } from "@/lib/ythd-storage-bridge";
import { type EnhancedBitratePreferences, SUFFIX_EBR, SUFFIX_SUPER_RESOLUTION } from "@/lib/ythd-types";
import {
  extractFpsFromLabel,
  getFpsFromRange,
  getPlayerDiv,
  getVisibleElement,
  OBSERVER_OPTIONS,
  SELECTORS
} from "@/lib/ythd-utils";

const MIN_QUALITY_DIGITS_IN_LABEL = 3;

type QualityOption = {
  element: HTMLDivElement;
  quality: number | string;
};

function getQualityNavigationItem(elPlayer: HTMLDivElement) {
  const elMenuItems = [...elPlayer.querySelectorAll<HTMLDivElement>(SELECTORS.menuOption)];
  return elMenuItems.find(item => {
    const content = item.querySelector<HTMLDivElement>(SELECTORS.menuOptionContent);
    return Boolean(content?.textContent?.match(new RegExp(`\\d{${MIN_QUALITY_DIGITS_IN_LABEL},}`)));
  }) ?? null;
}

function getIsLastOptionQuality(elVideo: HTMLVideoElement) {
  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return false;
  }

  if (getCurrentQualityElements(elVideo).length > 0) {
    return true;
  }

  if (getQualityNavigationItem(elPlayer)) {
    return true;
  }

  return Boolean(elPlayer.querySelector(SELECTORS.qualityDropDownTrigger));
}

export function getIsQualityElement(element: Element) {
  return Boolean(element.textContent?.trim().match(new RegExp(`^\\d{${MIN_QUALITY_DIGITS_IN_LABEL},}`)));
}

function getCurrentQualityElements(elVideo: HTMLVideoElement) {
  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return [];
  }

  return elPlayer
    .querySelectorAll<HTMLDivElement>(SELECTORS.menuOption)
    .values()
    .filter(getIsQualityElement)
    .toArray();
}

function convertQualityToNumber(elQuality: Element) {
  const isRegularQuality = !elQuality.querySelector(SELECTORS.labelPremium);
  const qualityNumber = qualities.find(quality => quality === parseInt(elQuality.textContent ?? "", 10));
  const isPremiumQuality = !isRegularQuality && Boolean(elQuality.textContent?.match(/premium/i));

  let result: number | string | undefined;
  if (!qualityNumber) {
    result = undefined;
  } else if (isRegularQuality) {
    result = qualityNumber;
  } else if (isPremiumQuality) {
    result = `${qualityNumber}${SUFFIX_EBR}`;
  } else {
    result = `${qualityNumber}${SUFFIX_SUPER_RESOLUTION}`;
  }

  return result;
}

// Each option keeps its own element. Returning two parallel lists and indexing one with the
// other's index silently selects the wrong quality the moment a label maps to nothing.
function getAvailableQualities(elVideo: HTMLVideoElement): QualityOption[] {
  return getCurrentQualityElements(elVideo).flatMap(element => {
    const quality = convertQualityToNumber(element);
    if (quality === undefined) {
      return [];
    }

    return [{
      element,
      quality
    }];
  });
}

export function getVideoFPS(elVideo: HTMLVideoElement) {
  const elQualities = getCurrentQualityElements(elVideo);
  for (const elQuality of elQualities) {
    if (elQuality.textContent) {
      return extractFpsFromLabel(elQuality.textContent);
    }
  }
  return 30;
}

function openQualityMenu(elVideo: HTMLVideoElement) {
  if (getCurrentQualityElements(elVideo).length > 0) {
    return;
  }

  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return;
  }

  const elQualityNavItem = getQualityNavigationItem(elPlayer);
  if (elQualityNavItem) {
    elQualityNavItem.click();
    return;
  }

  elPlayer.querySelector<HTMLElement>(SELECTORS.qualityDropDownTrigger)?.click();
}

function changeQuality(
  elVideo: HTMLVideoElement,
  isEnhancedBitrateCustom?: Partial<EnhancedBitratePreferences>,
  isUseSuperResolution?: boolean
) {
  if (!window.ythdLastUserQualities) {
    return;
  }

  const fpsVideo = getVideoFPS(elVideo);
  const fpsStep = getFpsFromRange(window.ythdLastUserQualities, fpsVideo);
  const optionsAvailable = getAvailableQualities(elVideo);
  const qualityPinnedByClick = window.ythdLastQualityClicked?.[fpsStep];
  const qualityPreferred = qualityPinnedByClick ?? window.ythdLastUserQualities[fpsStep];
  const isEnhancedBitrate = {
    ...window.ythdLastUserEnhancedBitrates,
    ...isEnhancedBitrateCustom
  };

  logDebug("choosing a quality", {
    fpsVideo,
    fpsStep,
    configured: window.ythdLastUserQualities,
    qualityPinnedByClick: qualityPinnedByClick ?? null,
    qualityPreferred,
    available: optionsAvailable.map(option => option.quality),
    isEnhancedBitrateWanted: isEnhancedBitrate[fpsStep],
    isUseSuperResolution
  });

  function applyQuality(option: QualityOption) {
    if (option.element.ariaChecked === "true") {
      logDebug("already on the wanted quality", { quality: option.quality });
      return;
    }

    logDebug("clicking quality", {
      quality: option.quality,
      label: option.element.textContent?.trim()
    });
    option.element.click();
  }

  function isQualityEligible(quality: string | number) {
    const qualityLabel = quality.toString();
    if (qualityLabel.endsWith(SUFFIX_EBR) && !isEnhancedBitrate[fpsStep]) {
      logDebug("skipping enhanced bitrate - not opted in for this frame rate", {
        quality: qualityLabel,
        fpsStep
      });
      return false;
    }

    if (qualityLabel.endsWith(SUFFIX_SUPER_RESOLUTION) && !isUseSuperResolution) {
      return false;
    }

    return true;
  }

  const optionPreferred = optionsAvailable.find(option => {
    if (!isQualityEligible(option.quality)) {
      return false;
    }

    return parseInt(option.quality.toString(), 10) <= parseInt(qualityPreferred.toString(), 10);
  });
  if (optionPreferred) {
    applyQuality(optionPreferred);
    return;
  }

  const optionLastEligible = optionsAvailable.findLast(option => isQualityEligible(option.quality));
  if (optionLastEligible) {
    applyQuality(optionLastEligible);
    return;
  }

  logDebug("no eligible quality to apply", { available: optionsAvailable.map(option => option.quality) });
}

function changeQualityWhenPossible(elVideo: HTMLVideoElement) {
  if (!getIsLastOptionQuality(elVideo)) {
    return false;
  }

  openQualityMenu(elVideo);

  if (getCurrentQualityElements(elVideo).length === 0) {
    return false;
  }

  changeQuality(
    elVideo,
    window.ythdLastEnhancedBitrateClicked,
    window.ythdIsUseSuperResolution
  );
  return true;
}

function closeMenu(elPlayer: HTMLDivElement) {
  function clickPanelBackIfPossible() {
    const elPanelHeaderBack = elPlayer.querySelector<HTMLButtonElement>(SELECTORS.panelHeaderBack);
    if (elPanelHeaderBack) {
      elPanelHeaderBack.click();
      return true;
    }

    return false;
  }

  if (clickPanelBackIfPossible()) {
    return;
  }

  new MutationObserver((_, observer) => {
    if (clickPanelBackIfPossible()) {
      observer.disconnect();
    }
  }).observe(elPlayer, OBSERVER_OPTIONS);
}

function getIsSettingsPanelOpen(elPlayer: HTMLDivElement) {
  const elSettingsButton = elPlayer.querySelector<HTMLButtonElement>(SELECTORS.buttonSettings);
  if (!elSettingsButton) {
    return false;
  }

  const isVorapis = elSettingsButton.ariaPressed === "true";
  return elSettingsButton.ariaExpanded === "true" || isVorapis;
}

function changeQualityOnPage(elVideo: HTMLVideoElement) {
  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return;
  }

  if (getIsSettingsPanelOpen(elPlayer)) {
    return;
  }

  const elSettings = elPlayer.querySelector<HTMLElement>(SELECTORS.buttonSettings);
  if (getCurrentQualityElements(elVideo).length === 0) {
    elSettings?.click();
    elSettings?.click();
  }

  if (changeQualityWhenPossible(elVideo)) {
    closeMenu(elPlayer);
    elSettings?.blur();
  }
}

export async function prepareToChangeQualityOnDesktop(e?: Event) {
  if (location.pathname.startsWith("/shorts/")) {
    return;
  }

  await loadStorageValues();

  const elVideo = e?.target ?? getVisibleElement(SELECTORS.video);
  if (!(elVideo instanceof HTMLVideoElement)) {
    return;
  }

  changeQualityOnPage(elVideo);
}
