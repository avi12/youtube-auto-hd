import {
  type EnhancedBitratePreferences,
  type EnhancedVideoQuality,
  type FullYouTubeLabel,
  SUFFIX_EBR,
  SUFFIX_SUPER_RESOLUTION,
  type SuperResolutionQuality,
  type VideoFPS,
  type VideoQuality
} from "@/lib/types";
import { initial } from "@/lib/ythd-setup";
import { getFpsFromRange, getStorage, getVisibleElement, OBSERVER_OPTIONS, SELECTORS } from "@/lib/ythd-utils";

function getPlayerDiv(elVideo: HTMLVideoElement) {
  return elVideo.closest(SELECTORS.player) as HTMLDivElement;
}

function getIsLastOptionQuality(elVideo: HTMLVideoElement) {
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

function getIsQualityElement(element: Element) {
  const isQuality = Boolean(element.textContent?.match(/\d/));
  const isHasChildren = element.children.length > 1;
  return isQuality && !isHasChildren;
}

function getCurrentQualityElements(): Array<HTMLDivElement> {
  const elMenuOptions = [...getVisibleElement(SELECTORS.player).querySelectorAll(SELECTORS.menuOption)];
  return elMenuOptions.filter(getIsQualityElement) as Array<HTMLDivElement>;
}

function convertQualityToNumber(elQuality: Element) {
  const isRegularQuality = !elQuality.querySelector(SELECTORS.labelPremium);
  const qualityNumber = parseInt(elQuality.textContent);
  if (isRegularQuality) {
    {
      return qualityNumber as VideoQuality;
    }
  }
  const isPremiumQuality = elQuality.textContent.match(/premium/i);
  if (isPremiumQuality) {
    return `${qualityNumber}${SUFFIX_EBR}` as EnhancedVideoQuality;
  }
  return `${qualityNumber}${SUFFIX_SUPER_RESOLUTION}` as SuperResolutionQuality;
}

function getAvailableQualities() {
  const elQualities = getCurrentQualityElements();
  return elQualities.map(convertQualityToNumber);
}

function getVideoFPS() {
  const elQualities = getCurrentQualityElements();
  const labelQuality = elQualities[0]?.textContent as FullYouTubeLabel;
  if (!labelQuality) {
    return 30;
  }
  const fpsMatch = labelQuality.match(/[ps](\d+)/);
  return fpsMatch ? (Number(fpsMatch[1]) as VideoFPS) : 30;
}

function openQualityMenu(elVideo: HTMLVideoElement) {
  const elSettingQuality = getPlayerDiv(elVideo).querySelector<HTMLDivElement>(SELECTORS.optionQuality);
  elSettingQuality?.click();
}

function changeQuality(
  qualityCustom?: VideoQuality | EnhancedVideoQuality,
  isEnhancedBitrateCustom?: Partial<EnhancedBitratePreferences>,
  isUseSuperResolution?: boolean
) {
  const fpsVideo = getVideoFPS();
  const fpsStep = getFpsFromRange(window.ythdLastUserQualities!, fpsVideo);
  const elQualities = getCurrentQualityElements();
  const qualitiesAvailable = getAvailableQualities();
  const qualityPreferred = qualityCustom || window.ythdLastUserQualities![fpsStep];
  const isEnhancedBitrate = { ...window.ythdLastUserEnhancedBitrates, ...isEnhancedBitrateCustom };

  const applyQuality = (iQuality: number) => {
    elQualities[iQuality]?.click();
  };

  const isQualityPreferredEBR = qualitiesAvailable[0].toString().endsWith(SUFFIX_EBR) && isEnhancedBitrate[fpsStep];
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
    elVideo.addEventListener("canplay", () => changeQualityWhenPossible(elVideo), { once: true });
    return;
  }

  openQualityMenu(elVideo);
  changeQuality(
    window.ythdLastQualityClicked!,
    window.ythdLastEnhancedBitrateClicked!,
    window.ythdIsUseSuperResolution!
  );
}

function getIsSettingsMenuOpen(): boolean {
  const elButtonSettings = getVisibleElement<HTMLButtonElement>(SELECTORS.buttonSettings);
  return elButtonSettings?.ariaExpanded === "true";
}

function closeMenu(elPlayer: HTMLDivElement) {
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

function changeQualityAndClose(elVideo: HTMLVideoElement, elPlayer: HTMLDivElement) {
  changeQualityWhenPossible(elVideo);
  closeMenu(elPlayer);
}

export async function prepareToChangeQualityOnDesktop(e?: Event) {
  window.ythdLastUserQualities = await getStorage({
    area: "local",
    key: "qualities",
    fallback: initial.qualities,
    updateWindowKey: "ythdLastUserQualities"
  });
  window.ythdLastUserEnhancedBitrates = await getStorage({
    area: "local",
    key: "isEnhancedBitrates",
    fallback: initial.isEnhancedBitrates,
    updateWindowKey: "ythdLastUserEnhancedBitrates"
  });
  window.ythdIsUseSuperResolution = await getStorage({
    area: "local",
    key: "isUseSuperResolution",
    fallback: initial.isUseSuperResolution,
    updateWindowKey: "ythdIsUseSuperResolution"
  });

  const elVideo = e?.target ?? getVisibleElement(SELECTORS.video);
  if (!(elVideo instanceof HTMLVideoElement)) {
    return;
  }

  const elPlayer = getPlayerDiv(elVideo);
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
