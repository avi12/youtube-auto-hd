import { prepareToChangeQualityOnDesktop } from "@/entrypoints/desktop-isolated.content/functions-desktop";
import { fpsSupported, initial, qualities } from "@/lib/ythd-defaults";
import { PlayerMessage, shortsMessenger } from "@/lib/ythd-player-messaging";
import { addStorageListeners } from "@/lib/ythd-storage-bridge";
import type {
  EnhancedBitratePreferences,
  QualityFpsPreferences,
  VideoFPS,
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
  if (!isTrusted || !(target instanceof HTMLElement) || location.pathname.startsWith("/shorts")) {
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

  const fps = (fpsSupported.find(fps => fps === Number(fpsMatch[1] || 30)) ?? 30) as VideoFPS;
  const qualityClicked = qualities.find(quality => quality === parseInt(labelQuality));
  if (qualityClicked) {
    window.ythdLastQualityClicked ??= {};
    window.ythdLastQualityClicked[fps] = qualityClicked;
  }
  window.ythdLastEnhancedBitrateClicked ??= {};
  window.ythdLastEnhancedBitrateClicked[fps] = Boolean(elQuality.querySelector(SELECTORS.labelPremium));
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
