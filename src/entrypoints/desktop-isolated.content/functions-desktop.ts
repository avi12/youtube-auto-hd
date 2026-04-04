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

const MIN_QUALITY_DIGITS_IN_LABEL = 3; // e.g. 3 characters in 720p

function getQualityMenuItem(elPlayer: HTMLDivElement) {
  const menuItems = elPlayer.querySelectorAll<HTMLDivElement>(SELECTORS.menuOption).values();
  return (
    menuItems.find(item => {
      const content = item.querySelector<HTMLDivElement>(SELECTORS.menuOptionContent);
      return Boolean(content?.textContent?.match(new RegExp(`\\d{${MIN_QUALITY_DIGITS_IN_LABEL},}`)));
    }) ?? null
  );
}

function getIsLastOptionQuality(elVideo: HTMLVideoElement) {
  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return false;
  }

  // Quality submenu items already in DOM (e.g. persisted from a previous interaction on Premium YouTube)
  if (getCurrentQualityElements(elVideo).length > 0) {
    return true;
  }

  if (getQualityMenuItem(elPlayer)) {
    return true;
  }

  return Boolean(elPlayer.querySelector(SELECTORS.qualityDropDownTrigger));
}

function getIsQualityElement(element: Element) {
  return element.children.length <= 2 && Boolean(element.textContent?.match(/\d{3,}/));
}

function getCurrentQualityElements(elVideo: HTMLVideoElement) {
  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return [];
  }

  return elPlayer
    .querySelectorAll<HTMLDivElement>(`${SELECTORS.menuOption}, ${SELECTORS.qualityOption}`)
    .values()
    .filter(getIsQualityElement)
    .toArray();
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
  return getCurrentQualityElements(elVideo)
    .values()
    .map(convertQualityToNumber)
    .filter(quality => quality !== undefined)
    .toArray();
}

function getVideoFPS(elVideo: HTMLVideoElement) {
  const elQualities = getCurrentQualityElements(elVideo);
  for (const elQuality of elQualities) {
    const fpsMatch = elQuality.textContent?.match(/[ps](\d+)/);
    if (fpsMatch) {
      return fpsSupported.find(fps => fps === Number(fpsMatch[1])) ?? 30;
    }
  }
  return 30;
}

function openQualityMenu(elVideo: HTMLVideoElement) {
  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return;
  }

  // Quality items already accessible — no need to navigate through main menu
  if (getCurrentQualityElements(elVideo).length > 0) {
    return;
  }

  const elSettingQuality = getQualityMenuItem(elPlayer);
  if (elSettingQuality) {
    elSettingQuality.click();
    return;
  }

  elPlayer.querySelector<HTMLElement>(SELECTORS.qualityDropDownTrigger)?.click();
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
    const element = elQualities[iQuality];
    if (!element || element.ariaChecked === "true") {
      return;
    }
    element.click();
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
  if (changeQualityWhenPossible(elVideo)) {
    closeMenu(elPlayer);
  }
}

function getIsSettingsPanelOpen(elPlayer: HTMLDivElement) {
  const elSettingsButton = elPlayer.querySelector<HTMLButtonElement>(SELECTORS.buttonSettings);
  if (!elSettingsButton) {
    return false;
  }
  const isVorapis = elSettingsButton.ariaPressed === "true";
  return elSettingsButton.ariaExpanded === "true" || isVorapis;
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

  // Don't interfere if the user currently has the settings panel open
  if (getIsSettingsPanelOpen(elPlayer)) {
    return;
  }

  // Only open/close the settings panel when quality elements aren't already in the DOM.
  // On VORAPIS, quality items are always present, so this step is unnecessary and
  // risks interfering with video buffering.
  if (getCurrentQualityElements(elVideo).length === 0) {
    const elSettings = elPlayer.querySelector<HTMLButtonElement>(SELECTORS.buttonSettings);
    elSettings?.click();
    elSettings?.click();
  }

  changeQualityAndClose(elVideo, elPlayer);

  elPlayer.querySelector<HTMLButtonElement>(SELECTORS.buttonSettings)?.blur();
}
