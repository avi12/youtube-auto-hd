import { prepareToChangeQualityOnDesktop } from "@/entrypoints/desktop.content/functions-desktop";
import type { EnhancedBitrateFpsPreferences, EnhancedBitratePreferences, VideoQuality } from "@/lib/types";
import { fpsSupported, qualities } from "@/lib/ythd-setup";
import {
  addGlobalEventListener,
  addStorageListener,
  getIsExtensionEnabled,
  getVisibleElement,
  OBSERVER_OPTIONS,
  SELECTORS
} from "@/lib/ythd-utils";

declare global {
  interface Window {
    [key: string]: unknown;
    ythdLastQualityClicked: VideoQuality | null;
    ythdLastEnhancedBitrateClicked: Partial<EnhancedBitratePreferences> | null;
    ythdLastUserQualities: EnhancedBitrateFpsPreferences | null;
    ythdLastUserEnhancedBitrates: EnhancedBitratePreferences | null;
    ythdIsUseSuperResolution: boolean | null;
    ythdExtEnabled: boolean;
  }
}
window.ythdLastQualityClicked = null;
window.ythdLastEnhancedBitrateClicked = {};
window.ythdIsUseSuperResolution = null;

let gTitleLast = document.title;
let gUrlLast = location.href;

function saveManualQualityChangeOnDesktop({ isTrusted, target }: Event): void {
  // We use programmatic clicks to change quality on desktop, but we need to save/respond only to user clicks
  if (!isTrusted || !(target instanceof HTMLElement)) {
    return;
  }

  function getQualityParentElement(elTarget: HTMLElement): HTMLElement {
    if (elTarget.matches(SELECTORS.labelPremium) || elTarget.matches("sup")) {
      return elTarget.parentElement!;
    }

    if (elTarget.matches("span")) {
      return elTarget;
    }

    return elTarget.querySelector<HTMLElement>("span, div > span")!;
  }

  const elQuality = getQualityParentElement(target);
  const labelQuality = elQuality?.textContent; // 480p, 720s, 1440p60, 1080p Premium, ...
  const fpsMatch = labelQuality?.match(/[ps](\d*)/);
  if (!fpsMatch) {
    return;
  }

  const fps = fpsSupported.find(f => f === Number(fpsMatch[1] || 30)) ?? 30;
  window.ythdLastQualityClicked = qualities.find(q => q === parseInt(labelQuality!)) ?? null;
  window.ythdLastEnhancedBitrateClicked![fps] = Boolean(elQuality.querySelector(SELECTORS.labelPremium));
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

  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!elVideo) {
    return;
  }

  const elPlayer = elVideo.closest(SELECTORS.player);
  if (!elPlayer) {
    return;
  }

  // We need to reset global variables, as well as prepare to change the quality of the new video
  window.ythdLastQualityClicked = null;
  window.ythdLastEnhancedBitrateClicked = {};
  await prepareToChangeQualityOnDesktop();
  elVideo.removeEventListener("canplay", prepareToChangeQualityOnDesktop);
  elPlayer.removeEventListener("click", saveManualQualityChangeOnDesktop);

  // Used to:
  // - Change the quality even if a pre-roll or a mid-roll ad is playing
  // - Change the quality if the video "refreshes", which happens when idling for a while (e.g. a couple of hours) and then resuming
  elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
  elPlayer.addEventListener("click", saveManualQualityChangeOnDesktop);
}

async function init(): Promise<void> {
  addGlobalEventListener(addTemporaryBodyListenerOnDesktop);
  addStorageListener();

  if (!(await getIsExtensionEnabled())) {
    return;
  }

  // When the user visits a /watch / /embed page,
  // the video's quality will be changed as soon as it loads
  new MutationObserver(async (_, observer) => {
    const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
    if (!elVideo) {
      return;
    }

    const elPlayer = elVideo.closest(SELECTORS.player);
    if (!elPlayer) {
      return;
    }

    const isEmbed = location.pathname.startsWith("/embed/");
    if (isEmbed) {
      observer.disconnect();
      await prepareToChangeQualityOnDesktop();
      return;
    }

    observer.disconnect();

    await prepareToChangeQualityOnDesktop();
    elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
    elPlayer.addEventListener("click", saveManualQualityChangeOnDesktop);
  }).observe(document, OBSERVER_OPTIONS);
}

export default defineContentScript({
  matches: ["https://www.youtube.com/*", "https://www.youtube-nocookie.com/*", "https://youtube.googleapis.com/*"],
  allFrames: true,
  main: () => init()
});
