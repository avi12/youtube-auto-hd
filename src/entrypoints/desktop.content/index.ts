import { prepareToChangeQualityOnDesktop } from "@/entrypoints/desktop.content/functions-desktop";
import type { EnhancedBitrateFpsPreferences, EnhancedBitratePreferences, VideoFPS, VideoQuality } from "@/lib/types";
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
let gPlayerObserver: MutationObserver;

function saveManualQualityChangeOnDesktop({ isTrusted, target }: Event): void {
  // We use programmatic clicks to change quality on desktop, but we need to save/respond only to user clicks
  if (!isTrusted) {
    return;
  }

  function getQualityParentElement(): HTMLSpanElement {
    const elQualityParent = target as HTMLElement;
    if (elQualityParent.matches(SELECTORS.labelPremium) || elQualityParent.matches("sup")) {
      return elQualityParent.parentElement!;
    }

    if (elQualityParent.matches("span")) {
      return elQualityParent;
    }

    return elQualityParent.querySelector("span, div > span")!;
  }

  const elQuality = getQualityParentElement();
  const labelQuality = elQuality?.textContent; // 480p, 720s, 1440p60, 1080p Premium, ...
  const fpsMatch = labelQuality?.match(/[ps](\d*)/);
  if (!fpsMatch) {
    return;
  }

  const fps = Number(fpsMatch[1] || 30) as VideoFPS;
  window.ythdLastQualityClicked = parseInt(labelQuality as string) as VideoQuality;
  window.ythdLastEnhancedBitrateClicked![fps] = Boolean(elQuality.querySelector(SELECTORS.labelPremium));
}

function getIsExit(mutations: Array<MutationRecord>): boolean {
  const regexExit = /ytp-tooltip-title|ytp-time-current|ytp-bound-time-right/;
  const target = mutations[mutations.length - 1].target as HTMLDivElement;
  return Boolean(target?.getAttribute("class")?.match(regexExit));
}

function addTemporaryBodyListenerOnDesktop(): void {
  if (!window.ythdExtEnabled) {
    return;
  }

  if (gTitleLast === document.title || gUrlLast === location.href) {
    return;
  }

  gTitleLast = document.title;
  gUrlLast = location.href;

  // Typically - listen to the player div (<video> container)
  // Otherwise, suppose it's a main channel page that has a channel trailer,
  // the <video> container wouldn't immediately exist, hence listen to the document
  const elementToTrack = getVisibleElement<HTMLDivElement>(SELECTORS.player) || document;

  if (!gPlayerObserver) {
    gPlayerObserver = new MutationObserver(async mutations => {
      const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
      if (getIsExit(mutations) || !elVideo) {
        return;
      }

      const elPlayer = elVideo.closest(SELECTORS.player);
      if (!elPlayer) {
        return;
      }

      // We need to reset global variables, as well as prepare to change the quality of the new video
      window.ythdLastQualityClicked = null;
      window.ythdLastEnhancedBitrateClicked = {};
      window.ythdIsUseSuperResolution = null;
      await prepareToChangeQualityOnDesktop();
      gPlayerObserver.disconnect();
    });
  }

  gPlayerObserver.observe(elementToTrack, OBSERVER_OPTIONS);
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
    // Used to:
    // - Change the quality even if a pre-roll or a mid-roll ad is playing
    // - Change the quality if the video "refreshes", which happens when idling for a while (e.g. a couple of hours) and then resuming
    document.addEventListener("canplay", prepareToChangeQualityOnDesktop, { capture: true });
    document.addEventListener("click", saveManualQualityChangeOnDesktop);
  }).observe(document, OBSERVER_OPTIONS);
}

export default defineContentScript({
  matches: ["https://www.youtube.com/*", "https://www.youtube-nocookie.com/*", "https://youtube.googleapis.com/*"],
  allFrames: true,
  main: () => init()
});
