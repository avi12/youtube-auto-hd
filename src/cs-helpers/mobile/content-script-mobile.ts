import { Storage } from "@plasmohq/storage";

import { labelToQuality } from "~shared-scripts/ythd-setup";
import {
  getElementByMutationObserver,
  getFpsFromRange,
  getPreferredQualities,
  SELECTORS,
  toggleMobileModal
} from "~shared-scripts/ythd-utils";
import type { QualityFpsPreferences, VideoFPS, VideoQuality, YouTubeLabel } from "~types";

let gPlayerResponse;
const EVENT = new Event("change", { bubbles: true });

function getVideoFPS(): VideoFPS {
  return gPlayerResponse.streamingData.adaptiveFormats[0].fps;
}

// A list of qualities that the video supports
function getSupportedQualities(): YouTubeLabel[] {
  const qualityLabels = gPlayerResponse.streamingData.adaptiveFormats.map(format => format.quality);
  return [...new Set(qualityLabels)] as YouTubeLabel[];
}

// A list of qualities that YouTube allows the user to choose from,
// which will be less than or equal to the list of qualities that the video supports
function getCurrentQualities(elDropdown: HTMLSelectElement): YouTubeLabel[] {
  return [...elDropdown.options].map(option => option.value as YouTubeLabel);
}

function getIntersectingQualities(
  pQualitiesSupported: YouTubeLabel[],
  pQualitiesThatYouTubeAllows: YouTubeLabel[]
): YouTubeLabel[] {
  return pQualitiesSupported.filter(quality => pQualitiesThatYouTubeAllows.includes(quality));
}

async function changeQualityOnMobile(qualityCustom?: VideoQuality): Promise<void> {
  const fpsVideo = getVideoFPS();
  const elDropdown = await getElementByMutationObserver<HTMLSelectElement>(SELECTORS.mobileQualityDropdown);
  const qualitiesThatThePlayerSupports = getIntersectingQualities(
    getSupportedQualities(),
    getCurrentQualities(elDropdown)
  );
  const qualitiesPreferred = await getPreferredQualities();
  const fpsStep = getFpsFromRange(qualitiesPreferred, fpsVideo);
  const qualityPreferred = qualityCustom || qualitiesPreferred[fpsStep];

  const applyQuality = async (iQuality: number): Promise<void> => {
    if (elDropdown) {
      elDropdown.value = qualitiesThatThePlayerSupports[iQuality];
      elDropdown.dispatchEvent(EVENT);
    }
  };

  const iQualityPreferred = qualitiesThatThePlayerSupports.findIndex(
    (label: YouTubeLabel) => labelToQuality[label] === qualityPreferred
  );
  if (iQualityPreferred > -1) {
    await applyQuality(iQualityPreferred);
    return;
  }

  await applyQuality(0);
}

async function getPlayerResponse(): Promise<object> {
  const response = await fetch(location.href);
  const textContent = await response.text();
  const regex = /ytInitialPlayerResponse = ({.+?});(?:var meta|<\/script|\n)/;
  return JSON.parse(textContent.match(regex)[1]);
}

async function openMenu(): Promise<void> {
  const elMainMenuButton = document.querySelector<HTMLButtonElement>(SELECTORS.mobileMainMenuButton);
  elMainMenuButton.click();

  const elMenuItemPlayback = document.querySelector<HTMLButtonElement>(SELECTORS.mobileMenuItemPlaybackSettings);
  elMenuItemPlayback.click();
}

export function saveManualQualityChangeOnMobile({ target, isTrusted }: Event): void {
  // We use programmatic "onchange" to change quality on mobile, but we need to save/respond only to <select> onchange
  if (!isTrusted) {
    return;
  }

  const elDropdownQuality = target as HTMLSelectElement;
  if (!elDropdownQuality.matches(SELECTORS.mobileQualityDropdown)) {
    return;
  }

  const label = elDropdownQuality.value as YouTubeLabel;
  window.ythdLastQualityClicked = labelToQuality[label];
}

const storageLocal = new Storage({ area: "local" });
storageLocal.watch({
  async qualities({ newValue: qualities }: { newValue: QualityFpsPreferences }) {
    window.ythdLastQualityClicked = null;
    window.ythdLastUserQualities = qualities;
    await prepareToChangeQualityOnMobile();
  }
});

export async function prepareToChangeQualityOnMobile(): Promise<void> {
  toggleMobileModal(false);

  // Changing the quality
  gPlayerResponse = await getPlayerResponse();
  await openMenu();

  const elOverlay = await getElementByMutationObserver<HTMLButtonElement>(SELECTORS.mobileOverlayDialog);
  elOverlay.addEventListener(
    "click",
    () => {
      // Account for pre-roll/mid-roll ads
      const elVideo = document.querySelector<HTMLVideoElement>(SELECTORS.video);
      elVideo.addEventListener("canplay", prepareToChangeQualityOnMobile, { once: true });
    },
    { once: true }
  );

  await changeQualityOnMobile(window.ythdLastQualityClicked);

  elOverlay.click();
  toggleMobileModal(true);
}
