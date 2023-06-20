import type { PlasmoCSConfig } from "plasmo";

import { prepareToChangeQualityOnDesktop } from "~cs-helpers/desktop/content-script-desktop";
import {
  OBSERVER_OPTIONS,
  SELECTORS,
  addGlobalEventListener,
  addStorageListener,
  getIsExtensionEnabled,
  getVisibleElement
} from "~shared-scripts/ythd-utils";
import type { QualityFpsPreferences, VideoQuality } from "~types";

declare global {
  interface Window {
    ythdLastQualityClicked: VideoQuality | null;
    ythdLastUserQualities: QualityFpsPreferences;
    ythdPlayerObserver: MutationObserver;
    ythdExtEnabled: boolean;
  }
}
window.ythdLastQualityClicked = null;

let gTitleLast = document.title;
let gUrlLast = location.href;
let gPlayerObserver: MutationObserver;

function saveManualQualityChangeOnDesktop({ isTrusted, target }: MouseEvent): void {
  // We use programmatic clicks to change quality on desktop, but we need to save/respond only to user clicks
  if (!isTrusted) {
    return;
  }

  const elQualityParent = target as HTMLElement;
  const elQuality = elQualityParent.querySelector("div > span, span");
  const labelQuality = elQuality?.firstChild.textContent; // 480p, 720s, 1080p60, ...
  const isContainsQualityLabel = labelQuality?.match(/[ps](\d{2,3})?$/);
  if (!isContainsQualityLabel) {
    return;
  }

  const quality = parseInt(labelQuality.match(/\d{3,4}/)?.[0]) as VideoQuality;
  if (!isNaN(quality)) {
    window.ythdLastQualityClicked = quality;
  }
}

function getIsExit(mutations: MutationRecord[]): boolean {
  const regexExit = /ytp-tooltip-title|ytp-time-current|ytp-bound-time-right/;
  const target = mutations[mutations.length - 1].target as HTMLDivElement;
  return Boolean(target?.className.match(regexExit));
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
      await prepareToChangeQualityOnDesktop();
      elVideo.removeEventListener("canplay", prepareToChangeQualityOnDesktop);
      elPlayer.removeEventListener("click", saveManualQualityChangeOnDesktop);

      // Used to:
      // - Change the quality even if a pre-roll or a mid-roll ad is playing
      // - Change the quality if the video "refreshes", which happens when idling for a while (e.g. a couple of hours) and then resuming
      elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
      elPlayer.addEventListener("click", saveManualQualityChangeOnDesktop);

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
    const elLogo = getVisibleElement(SELECTORS.logo);
    if (!elVideo || !elLogo) {
      return;
    }

    const elPlayer = elVideo.closest(SELECTORS.player);
    if (!elPlayer) {
      return;
    }

    observer.disconnect();

    const isEmbed = location.pathname.startsWith("/embed/");
    if (isEmbed) {
      await prepareToChangeQualityOnDesktop();
      return;
    }

    await prepareToChangeQualityOnDesktop();
    elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
    elPlayer.addEventListener("click", saveManualQualityChangeOnDesktop);
  }).observe(document, OBSERVER_OPTIONS);
}

init();

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*", "https://www.youtube-nocookie.com/*", "https://youtube.googleapis.com/*"],
  all_frames: true
};
