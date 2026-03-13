import { prepareToChangeQualityOnDesktop } from "@/entrypoints/desktop-isolated.content/functions-desktop";
import { fpsSupported, initial, qualities } from "@/lib/ythd-defaults";
import { PlayerMessage, shortsMessenger } from "@/lib/ythd-player-messaging";
import type {
  EnhancedBitrateFpsPreferences,
  EnhancedBitratePreferences,
  QualityFpsPreferences,
  VideoQuality
} from "@/lib/ythd-types";
import {
  addGlobalEventListener,
  getIsExtensionEnabled,
  getPlayerDiv,
  getVisibleElement,
  OBSERVER_OPTIONS,
  SELECTORS
} from "@/lib/ythd-utils";
import { storage } from "#imports";

declare global {
  interface Window {
    ythdLastQualityClicked: VideoQuality | undefined;
    ythdLastEnhancedBitrateClicked: Partial<EnhancedBitratePreferences> | undefined;
    ythdLastUserQualities: EnhancedBitrateFpsPreferences | null;
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

async function sendQualityToShortsMainWorld() {
  const qualityPreferences = await storage.getItem<QualityFpsPreferences>("local:qualities", {
    fallback: initial.qualities
  });
  await shortsMessenger.sendMessage(PlayerMessage.APPLY_QUALITY, qualityPreferences);
}

function getQualityParentElement(elTarget: HTMLElement) {
  if (elTarget.matches(SELECTORS.labelPremium) || elTarget.matches("sup")) {
    return elTarget.parentElement ?? elTarget;
  }
  if (elTarget.matches("span")) {
    return elTarget;
  }
  return elTarget.querySelector<HTMLElement>("span, div > span");
}

function saveManualQualityChangeOnDesktop({ isTrusted, target }: Event) {
  // We use programmatic clicks to change quality on desktop, but we need to save/respond only to user clicks
  if (!isTrusted || !(target instanceof HTMLElement) || location.pathname.startsWith("/shorts")) {
    return;
  }

  const elQuality = getQualityParentElement(target);
  if (!elQuality) {
    return;
  }

  const labelQuality = elQuality.textContent; // 480p, 720s, 1440p60, 1080p Premium, ...
  if (!labelQuality) {
    return;
  }

  const fpsMatch = labelQuality.match(/[ps](\d*)/);
  if (!fpsMatch) {
    return;
  }

  const fps = fpsSupported.find(fps => fps === Number(fpsMatch[1] || 30)) ?? 30;
  window.ythdLastQualityClicked = qualities.find(quality => quality === parseInt(labelQuality));
  window.ythdLastEnhancedBitrateClicked ??= {};
  window.ythdLastEnhancedBitrateClicked[fps] = Boolean(elQuality.querySelector(SELECTORS.labelPremium));
}

async function handleShortsNavigation(elVideo: HTMLVideoElement) {
  elVideo.removeEventListener("canplay", prepareToChangeQualityOnDesktop);
  elVideo.removeEventListener("canplay", sendQualityToShortsMainWorld);
  if (elVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    await sendQualityToShortsMainWorld();
  } else {
    elVideo.addEventListener("canplay", sendQualityToShortsMainWorld, { once: true });
  }
}

function observeForVideoOnNonWatchPage() {
  // Non-watch pages (channel pages, home, etc.) may have a video that loads async (e.g. channel trailer).
  // Observe until a visible video appears, then apply quality.
  const urlAtObserverSetup = location.href;
  gPendingVideoObserver = new MutationObserver(async (_, observer) => {
    // Guard against a race where another navigation fires before the video appears
    if (location.href !== urlAtObserverSetup) {
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

  // Cancel any pending observer from a previous navigation (e.g. user left channel page before trailer loaded)
  gPendingVideoObserver?.disconnect();
  gPendingVideoObserver = null;

  if (isShortsPage()) {
    const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
    if (!elVideo) {
      return;
    }
    await handleShortsNavigation(elVideo);
    return;
  }

  window.ythdLastQualityClicked = undefined;
  window.ythdLastEnhancedBitrateClicked = {};

  await prepareToChangeQualityOnDesktop();

  // Re-query after the async operation: the video may have changed during navigation
  // (e.g. a channel trailer was visible before the await, but the watch page video is visible now).
  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!elVideo) {
    // No visible video yet — e.g. navigating to a channel page where the trailer loads async.
    observeForVideoOnNonWatchPage();
    return;
  }

  const elPlayer = getPlayerDiv(elVideo);
  if (!elPlayer) {
    return;
  }

  elVideo.removeEventListener("canplay", sendQualityToShortsMainWorld);
  elVideo.removeEventListener("canplay", prepareToChangeQualityOnDesktop);
  elPlayer.removeEventListener("click", saveManualQualityChangeOnDesktop);

  // Used to:
  // - Change the quality even if a pre-roll or a mid-roll ad is playing
  // - Change the quality if the video "refreshes", which happens when idling for a while (e.g. a couple of hours) and then resuming
  elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
  elPlayer.addEventListener("click", saveManualQualityChangeOnDesktop);
}

function addStorageListeners() {
  storage.watch<boolean>("local:isExtensionEnabled", async isExtEnabled => {
    window.ythdExtEnabled = isExtEnabled ?? false;
    if (!isExtEnabled) {
      return;
    }
    if (isShortsPage()) {
      await sendQualityToShortsMainWorld();
    } else {
      await prepareToChangeQualityOnDesktop();
    }
  });

  storage.watch<QualityFpsPreferences>("local:qualities", async qualityPreferences => {
    window.ythdLastQualityClicked = undefined;
    window.ythdLastUserQualities = qualityPreferences;
    if (!window.ythdExtEnabled) {
      return;
    }
    if (isShortsPage()) {
      await sendQualityToShortsMainWorld();
    } else {
      await prepareToChangeQualityOnDesktop();
    }
  });

  storage.watch<EnhancedBitratePreferences>("local:isEnhancedBitrates", async isEnhancedBitrates => {
    window.ythdLastEnhancedBitrateClicked = isEnhancedBitrates ?? undefined;
    if (!window.ythdExtEnabled) {
      return;
    }
    await prepareToChangeQualityOnDesktop();
  });

  storage.watch<boolean>("local:isUseSuperResolution", async isUseSuperResolution => {
    window.ythdIsUseSuperResolution = isUseSuperResolution ?? undefined;
    if (!window.ythdExtEnabled) {
      return;
    }
    await prepareToChangeQualityOnDesktop();
  });
}

function observeForInitialVideo() {
  // When the user visits a /shorts or /embed or a different video page,
  // the video's quality will be changed as soon as it loads
  new MutationObserver(async (_, observer) => {
    const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
    if (!elVideo) {
      return;
    }

    if (isShortsPage()) {
      observer.disconnect();
      await sendQualityToShortsMainWorld();
      return;
    }

    const elPlayer = getPlayerDiv(elVideo);
    if (!elPlayer) {
      return;
    }

    observer.disconnect();
    elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
    elPlayer.addEventListener("click", saveManualQualityChangeOnDesktop);
    await prepareToChangeQualityOnDesktop();
  }).observe(document, OBSERVER_OPTIONS);
}

async function init() {
  await addGlobalEventListener(addTemporaryBodyListenerOnDesktop);
  addStorageListeners();

  window.ythdExtEnabled = await getIsExtensionEnabled(window.ythdExtEnabled);
  if (!window.ythdExtEnabled) {
    return;
  }

  observeForInitialVideo();
}

export default defineContentScript({
  matches: ["https://www.youtube.com/*", "https://www.youtube-nocookie.com/*", "https://youtube.googleapis.com/*"],
  allFrames: true,
  main: () => init()
});
