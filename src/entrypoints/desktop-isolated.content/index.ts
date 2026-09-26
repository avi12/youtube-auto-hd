import {
  getIsQualityElement,
  getVideoFPS,
  prepareToChangeQualityOnDesktop
} from "@/entrypoints/desktop-isolated.content/functions-desktop";
import { logDebug } from "@/lib/ythd-debug";
import { initial, qualities } from "@/lib/ythd-defaults";
import { PlayerMessage, shortsMessenger } from "@/lib/ythd-player-messaging";
import { addStorageListeners } from "@/lib/ythd-storage-bridge";
import type { EnhancedBitratePreferences, QualityFpsPreferences } from "@/lib/ythd-types";
import {
  addGlobalEventListener,
  getIsExtensionEnabled,
  getFpsFromRange,
  getPlayerDiv,
  getVisibleElement,
  OBSERVER_OPTIONS,
  SELECTORS
} from "@/lib/ythd-utils";
import { storage } from "#imports";

declare global {
  interface Window {
    ythdLastQualityClicked: Partial<QualityFpsPreferences> | undefined;
    ythdLastEnhancedBitrateClicked: Partial<EnhancedBitratePreferences> | undefined;
    ythdLastUserQualities: QualityFpsPreferences | null;
    ythdLastUserEnhancedBitrates: EnhancedBitratePreferences | null;
    ythdIsUseSuperResolution: boolean | undefined;
    ythdExtEnabled: boolean;
  }
}
window.ythdLastEnhancedBitrateClicked = {};

let gTitleLast = document.title;
let gUrlLast = location.href;
let gPendingVideoObserver: MutationObserver | null = null;

function isShortsPage() {
  return location.pathname.startsWith("/shorts/");
}

async function sendQualityToMainWorld() {
  const qualityPreferences = await storage.getItem<QualityFpsPreferences>("local:qualities", {
    fallback: initial.qualities
  });
  void shortsMessenger.sendMessage(PlayerMessage.APPLY_QUALITY, qualityPreferences);
}

// The settings menu's "Quality" row carries the quality it would open onto as its own label
// ("Quality  2160p60 4K"), so anything that matched a label was also matched by the row that
// merely OPENS the list. Checking the current quality was therefore recorded as choosing it -
// pinning whatever happened to be playing, and clearing the enhanced-bitrate preference with it,
// because the Premium badge sits on the option and not on that row (#217).
//
// Only a real option counts. The answer has to come from the clicked node alone: YouTube swaps the
// panel back to its top level as part of handling the same click, so anything that re-queries the
// menu afterwards finds the list already gone.
//
// An option's own row reads "1080p60 HD" and the row that opens the list reads "Quality1080p60 HD",
// so the existing "starts with a quality number" test separates them - the same one that decides
// which rows are options in the first place.
function getQualityOptionClicked(elTarget: HTMLElement) {
  const elQualityOptionV3 = elTarget.closest<HTMLElement>(SELECTORS.qualityOption);
  if (elQualityOptionV3) {
    return elQualityOptionV3;
  }

  const elMenuItem = elTarget.closest<HTMLElement>(SELECTORS.menuItem);
  if (elMenuItem && getIsQualityElement(elMenuItem)) {
    return elMenuItem;
  }

  return null;
}

function saveManualQualityChangeOnDesktop({ isTrusted, target }: Event) {
  if (!isTrusted || !(target instanceof HTMLElement) || location.pathname.startsWith("/shorts")) {
    return;
  }

  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!elVideo) {
    return;
  }

  const elQuality = getQualityOptionClicked(target);
  if (!elQuality) {
    return;
  }

  const labelQuality = elQuality.textContent;
  if (!labelQuality) {
    return;
  }

  const qualityClicked = qualities.find(quality => quality === parseInt(labelQuality));
  if (!qualityClicked) {
    return;
  }

  // Read off the option itself: the Premium badge is a child of the option, never of the inner
  // label span the old lookup could land on
  const isEnhancedBitrateClicked = Boolean(elQuality.querySelector(SELECTORS.labelPremium));
  const fps = getFpsFromRange(window.ythdLastUserQualities ?? initial.qualities, getVideoFPS(elVideo));
  window.ythdLastQualityClicked ??= {};
  window.ythdLastQualityClicked[fps] = qualityClicked;
  window.ythdLastEnhancedBitrateClicked ??= {};
  window.ythdLastEnhancedBitrateClicked[fps] = isEnhancedBitrateClicked;
  logDebug("manual quality change recorded", {
    label: labelQuality.trim(),
    fps,
    quality: qualityClicked,
    isEnhancedBitrate: isEnhancedBitrateClicked
  });
}

function handleShortsNavigation(elVideo: HTMLVideoElement) {
  elVideo.removeEventListener("canplay", prepareToChangeQualityOnDesktop);
  elVideo.removeEventListener("canplay", sendQualityToMainWorld);

  if (elVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    void sendQualityToMainWorld();
  } else {
    elVideo.addEventListener("canplay", sendQualityToMainWorld, { once: true });
  }
}

function observeForVideoOnNonWatchPage() {
  const urlAtObserverSetup = location.href;
  gPendingVideoObserver = new MutationObserver(async (_, observer) => {
    const urlChangedBeforeVideoAppeared = location.href !== urlAtObserverSetup;
    if (urlChangedBeforeVideoAppeared) {
      observer.disconnect();
      return;
    }

    const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
    if (!elVideo) {
      return;
    }

    observer.disconnect();
    gPendingVideoObserver = null;
    const elPlayer = getPlayerDiv(elVideo);
    if (!elPlayer) {
      return;
    }

    elVideo.removeEventListener("canplay", prepareToChangeQualityOnDesktop);
    elPlayer.removeEventListener("click", saveManualQualityChangeOnDesktop);
    await prepareToChangeQualityOnDesktop();
    elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
    elPlayer.addEventListener("click", saveManualQualityChangeOnDesktop);
  });
  gPendingVideoObserver.observe(document, OBSERVER_OPTIONS);
}

async function addTemporaryBodyListenerOnDesktop() {
  if (!window.ythdExtEnabled) {
    return;
  }

  if (gTitleLast === document.title || gUrlLast === location.href) {
    return;
  }

  gTitleLast = document.title;
  gUrlLast = location.href;

  gPendingVideoObserver?.disconnect();
  gPendingVideoObserver = null;

  if (isShortsPage()) {
    const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
    if (!elVideo) {
      return;
    }

    handleShortsNavigation(elVideo);
    return;
  }

  await prepareToChangeQualityOnDesktop();

  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!elVideo) {
    observeForVideoOnNonWatchPage();
    return;
  }

  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return;
  }

  elVideo.removeEventListener("canplay", sendQualityToMainWorld);
  elVideo.removeEventListener("canplay", prepareToChangeQualityOnDesktop);
  elPlayer.removeEventListener("click", saveManualQualityChangeOnDesktop);

  elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
  elPlayer.addEventListener("click", saveManualQualityChangeOnDesktop);
}

function observeForInitialVideo() {
  new MutationObserver((_, observer) => {
    const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
    if (!elVideo) {
      return;
    }

    if (isShortsPage()) {
      observer.disconnect();
      void sendQualityToMainWorld();
      return;
    }

    const elPlayer = getPlayerDiv(elVideo);
    if (!elPlayer) {
      return;
    }

    observer.disconnect();
    elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
    elPlayer.addEventListener("click", saveManualQualityChangeOnDesktop);
    void prepareToChangeQualityOnDesktop();
  }).observe(document, OBSERVER_OPTIONS);
}

async function init() {
  addStorageListeners(() => {
    if (isShortsPage()) {
      void sendQualityToMainWorld();
      return;
    }

    void prepareToChangeQualityOnDesktop();
  });

  window.ythdExtEnabled = await getIsExtensionEnabled(window.ythdExtEnabled);

  if (!window.ythdExtEnabled) {
    return;
  }

  void addGlobalEventListener(addTemporaryBodyListenerOnDesktop);
  observeForInitialVideo();
}

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  main: () => init()
});
