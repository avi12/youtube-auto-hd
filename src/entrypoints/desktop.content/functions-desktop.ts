import {
  type EnhancedBitratePreferences,
  type EnhancedVideoQuality,
  type FullYouTubeLabel,
  SUFFIX_EBR,
  type VideoFPS,
  type VideoQuality
} from "@/lib/types";
import { initial } from "@/lib/ythd-setup";
import { getFpsFromRange, getStorage, getVisibleElement, OBSERVER_OPTIONS, SELECTORS } from "@/lib/ythd-utils";

function getPlayerDiv(elVideo: HTMLVideoElement): HTMLDivElement {
  return elVideo.closest(SELECTORS.player) as HTMLDivElement;
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

function getIsQualityElement(element: Element): boolean {
  const isQuality = Boolean(element.textContent?.match(/\d/));
  const isHasChildren = element.children.length > 1;
  return isQuality && !isHasChildren;
}

function getCurrentQualityElements(): Array<HTMLDivElement> {
  const elMenuOptions = [...getVisibleElement(SELECTORS.player).querySelectorAll(SELECTORS.menuOption)];
  return elMenuOptions.filter(getIsQualityElement) as Array<HTMLDivElement>;
}

function convertQualityToNumber(elQuality: Element): VideoQuality | EnhancedVideoQuality {
  const isPremiumQuality = Boolean(elQuality.querySelector(SELECTORS.labelPremium));
  const qualityNumber = parseInt(elQuality.textContent!);
  if (isPremiumQuality) {
    return (qualityNumber + SUFFIX_EBR) as EnhancedVideoQuality;
  }
  return qualityNumber as VideoQuality;
}

function getAvailableQualities(): (VideoQuality | EnhancedVideoQuality)[] {
  const elQualities = getCurrentQualityElements();
  return elQualities.map(convertQualityToNumber);
}

function getVideoFPS(): number {
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
  elSettingQuality?.click();
}

function changeQuality(
  qualityCustom?: VideoQuality | EnhancedVideoQuality,
  isEnhancedBitrateCustom?: Partial<EnhancedBitratePreferences>
): void {
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

  const iQualityPreferred = qualitiesAvailable.findIndex(quality => quality === qualityPreferred);
  if (iQualityPreferred > -1) {
    applyQuality(iQualityPreferred);
    return;
  }

  const iQualityFallback = qualitiesAvailable.findIndex(
    quality => !quality.toString().endsWith(SUFFIX_EBR) && quality < qualityPreferred
  );
  applyQuality(iQualityFallback);
}

function changeQualityWhenPossible(elVideo: HTMLVideoElement): void {
  if (!getIsLastOptionQuality(elVideo)) {
    elVideo.addEventListener("canplay", () => changeQualityWhenPossible(elVideo), { once: true });
    return;
  }

  openQualityMenu(elVideo);
  changeQuality(window.ythdLastQualityClicked!, window.ythdLastEnhancedBitrateClicked);
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

  const elVideo = (e?.target ?? getVisibleElement(SELECTORS.video)) as HTMLVideoElement;
  if (!elVideo) {
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
  await changeQualityAndClose(elVideo, elPlayer);

  elPlayer.querySelector<HTMLButtonElement>(SELECTORS.buttonSettings)?.blur();
}
