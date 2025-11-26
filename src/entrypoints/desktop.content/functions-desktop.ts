import {
  type EnhancedBitratePreferences,
  type EnhancedVideoQuality,
  type FullYouTubeLabel,
  SUFFIX_EBR,
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

interface QualityDetail {
  key: string;
  value: {
    paygatedIndicatorText: string;
    trackingParams: string;
  };
}

interface PlayabilityStatus {
  contextParams: string;
  miniplayer: Record<string, unknown>;
  offlineability: Record<string, unknown>;
  paygatedQualitiesMetadata?: {
    qualityDetails: QualityDetail[];
  };
}

function convertQualityToNumber(
  elQuality: Element,
  playabilityStatus: PlayabilityStatus
): VideoQuality | EnhancedVideoQuality {
  const qualityNumber = parseInt(elQuality.textContent!);
  const { paygatedQualitiesMetadata } = playabilityStatus;
  if (!paygatedQualitiesMetadata) {
    return qualityNumber as VideoQuality; // regular quality
  }

  const isPremiumQuality =
    elQuality.querySelector(SELECTORS.labelPremium) &&
    paygatedQualitiesMetadata.qualityDetails[0].key.match(/premium/i);
  if (isPremiumQuality) {
    return (qualityNumber + SUFFIX_EBR) as EnhancedVideoQuality;
  }
  return qualityNumber as VideoQuality; // either super resolution or regular quality
}

function getAvailableQualities(playabilityStatus: PlayabilityStatus): (VideoQuality | EnhancedVideoQuality)[] {
  const elQualities = getCurrentQualityElements();
  return elQualities.map(elQUality => convertQualityToNumber(elQUality, playabilityStatus));
}

function getVideoFPS(adaptiveFormats: Record<string, any>[]): number {
  const video = adaptiveFormats.find(format => "fps" in format)!;
  return video.fps;
}

function openQualityMenu(elVideo: HTMLVideoElement) {
  const elSettingQuality = getPlayerDiv(elVideo).querySelector<HTMLDivElement>(SELECTORS.optionQuality);
  elSettingQuality?.click();
}

async function getInitialPlayerResponse() {
  const body = await (await fetch(location.href)).text();

  function getJson(body: string) {
    return JSON.parse(body.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script|\n)/)![1]);
  }

  try {
    return getJson(body);
  } catch {
    if (location.pathname.startsWith("/embed")) {
      const videoId = location.pathname.split("/").pop();
      const bodyEmbed = await (await fetch(`https://www.youtube.com/watch?v=${videoId}`)).text();
      return getJson(bodyEmbed);
    }
    const elChannelTrailerContainer = getVisibleElement<HTMLDivElement>(SELECTORS.channelTrailerContainer);
    const elAVideo = elChannelTrailerContainer.querySelector<HTMLAnchorElement>("a[href*=watch]");
    const bodyTrailer = await (await fetch(elAVideo!.href)).text();
    return getJson(bodyTrailer);
  }
}

async function changeQuality(
  qualityCustom?: VideoQuality | EnhancedVideoQuality,
  isEnhancedBitrateCustom?: Partial<EnhancedBitratePreferences>,
  isUseSuperResolution?: boolean
) {
  const ytInitialPlayerResponse = await getInitialPlayerResponse();
  const fpsVideo = getVideoFPS(ytInitialPlayerResponse.streamingData.adaptiveFormats);
  const fpsStep = getFpsFromRange(window.ythdLastUserQualities!, fpsVideo);
  const elQualities = getCurrentQualityElements();
  const qualitiesAvailable = getAvailableQualities(ytInitialPlayerResponse.playabilityStatus);
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

  const paygatedQualitiesMetadata = ytInitialPlayerResponse.playabilityStatus?.paygatedQualitiesMetadata;
  const isSuperResolution = !paygatedQualitiesMetadata?.qualityDetails[0]?.key?.match(/premium/i);

  if (isSuperResolution && !isUseSuperResolution) {
    const superResolutionQualitiesSorted: VideoQuality[] = paygatedQualitiesMetadata.qualityDetails
      .map(detail => parseInt(detail.key))
      .sort((a, b) => a - b);

    const superResolutionQualityLowest = superResolutionQualitiesSorted[0];
    const iHighestRegularQuality = qualitiesAvailable.indexOf(superResolutionQualityLowest) + 1;
    applyQuality(iHighestRegularQuality);
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

async function changeQualityWhenPossible() {
  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!getIsLastOptionQuality(elVideo)) {
    elVideo.addEventListener("canplay", changeQualityWhenPossible, { once: true });
    return;
  }

  openQualityMenu(elVideo);
  await changeQuality(
    window.ythdLastQualityClicked!,
    window.ythdLastEnhancedBitrateClicked!,
    window.ythdIsUseSuperResolution!
  );
}

function getIsSettingsMenuOpen() {
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

async function changeQualityAndClose(elPlayer: HTMLDivElement) {
  await changeQualityWhenPossible();
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
  await changeQualityAndClose(elPlayer);

  elPlayer.querySelector<HTMLButtonElement>(SELECTORS.buttonSettings)?.blur();
}
