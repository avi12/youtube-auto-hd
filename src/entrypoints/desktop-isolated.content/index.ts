import { prepareToChangeQualityOnDesktop } from "@/entrypoints/desktop-isolated.content/functions-desktop";
import { fpsSupported, initial, qualities } from "@/lib/ythd-defaults";
import { PlayerMessage, shortsMessenger } from "@/lib/ythd-player-messaging";
import type {
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
  const elQualityOptionV3 = elTarget.closest<HTMLElement>(SELECTORS.qualityOption);
  if (elQualityOptionV3) {
    return elQualityOptionV3;
  }
  return elTarget.querySelector<HTMLElement>("span, div > span");
}

function saveManualQualityChangeOnDesktop({ isTrusted, target }: Event) {
  const isUserClick = isTrusted;
  if (!isUserClick || !(target instanceof HTMLElement) || location.pathname.startsWith("/shorts")) {
    return;
  }

  const elQuality = getQualityParentElement(target);
  if (!elQuality) {
    return;
  }

  const labelQuality = elQuality.textContent;
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
    await handleShortsNavigation(elVideo);
    return;
  }

  window.ythdLastQualityClicked = undefined;
  window.ythdLastEnhancedBitrateClicked = {};

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

  elVideo.removeEventListener("canplay", sendQualityToShortsMainWorld);
  elVideo.removeEventListener("canplay", prepareToChangeQualityOnDesktop);
  elPlayer.removeEventListener("click", saveManualQualityChangeOnDesktop);

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
    window.ythdLastUserQualities = qualityPreferences;
    const userChoseQualityManuallyForCurrentVideo = window.ythdLastQualityClicked !== undefined;
    if (userChoseQualityManuallyForCurrentVideo) {
      return;
    }
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
    if (!window.ythdExtEnabled || window.ythdLastQualityClicked !== undefined) {
      return;
    }
    await prepareToChangeQualityOnDesktop();
  });

  storage.watch<boolean>("local:isUseSuperResolution", async isUseSuperResolution => {
    window.ythdIsUseSuperResolution = isUseSuperResolution ?? undefined;
    if (!window.ythdExtEnabled || window.ythdLastQualityClicked !== undefined) {
      return;
    }
    await prepareToChangeQualityOnDesktop();
  });
}

function observeForInitialVideo() {
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
