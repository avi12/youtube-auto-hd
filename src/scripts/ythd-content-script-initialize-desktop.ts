import { initial } from "../shared-scripts/ythd-setup";
import {
  addGlobalEventListener,
  getVisibleElement,
  observerOptions,
  Selectors
} from "../shared-scripts/ythd-utilities";
import type { QualityFpsPreferences, VideoAutoResize, VideoQuality, VideoSize } from "../types";
import { injectDonationSectionWhenNeeded } from "./ythd-content-script-donate";
import { prepareToChangeQualityOnDesktop } from "./ythd-content-script-functions-desktop";
import { resizePlayerIfNeeded } from "./ythd-content-script-resize";

declare global {
  interface Window {
    ythdLastQualityClicked: VideoQuality | null;
    ythdLastUserQualities: QualityFpsPreferences;
    ythdPlayerObserver: MutationObserver;
    ythdPlayerSize: VideoSize;
    ythdPlayerAutoResize: VideoAutoResize;
  }
}

window.ythdLastQualityClicked = null;

let gTitleLast = document.title;
let gUrlLast = location.href;
let gPlayerObserver: MutationObserver;

function addTemporaryBodyListenerOnDesktop(): void {
  if (gTitleLast === document.title || gUrlLast === location.href) {
    return;
  }

  gTitleLast = document.title;
  gUrlLast = location.href;

  injectDonationSectionWhenNeeded();

  // Typically - listen to the player div (<video> container)
  // Otherwise, say it's a main channel page that has a channel trailer,
  // the <video> container wouldn't immediately exist, hence listen to the document
  const elementToTrack = getVisibleElement<HTMLDivElement>(Selectors.player) || document;

  if (!gPlayerObserver) {
    gPlayerObserver = new MutationObserver(async mutations => {
      const elVideo = getVisibleElement<HTMLVideoElement>(Selectors.video);
      if (getIsExit(mutations) || !elVideo) {
        return;
      }
      const elPlayer = elVideo.closest(Selectors.player);

      resizePlayerIfNeeded();

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

  gPlayerObserver.observe(elementToTrack, observerOptions);
}

// The ultimate fix for the "notification panel closes" issue
// I don't know what it has to do with those classes, but it works
const getIsExit: (mutations: MutationRecord[]) => boolean = mutations => {
  const regexExit = /ytp-tooltip-title|ytp-time-current|ytp-bound-time-right/;
  const target = mutations[mutations.length - 1].target as HTMLDivElement;
  return Boolean(target?.className.match(regexExit));
};

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

async function setPlayerSize(): Promise<void> {
  const { size = initial.size, autoResize = initial.isResizeVideo } = await new Promise(resolve =>
    chrome.storage.sync.get(["size", "autoResize"], resolve)
  );
  window.ythdPlayerSize = size;
  window.ythdPlayerAutoResize = autoResize;
}

async function init(): Promise<void> {
  addGlobalEventListener(addTemporaryBodyListenerOnDesktop);
  await setPlayerSize();

  // When the user visits a /watch / /embed page,
  // the video's quality will be changed as soon as it loads
  new MutationObserver(async (_, observer) => {
    const elVideo = getVisibleElement<HTMLVideoElement>(Selectors.video);
    if (!elVideo) {
      return;
    }
    const elPlayer = elVideo.closest(Selectors.player);

    observer.disconnect();

    const isEmbed = location.pathname.startsWith("/embed/");
    if (!isEmbed) {
      injectDonationSectionWhenNeeded();
      resizePlayerIfNeeded();
      await prepareToChangeQualityOnDesktop();
      elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
      elPlayer.addEventListener("click", saveManualQualityChangeOnDesktop);
      return;
    }

    await prepareToChangeQualityOnDesktop();
  }).observe(document, observerOptions);
}

init();
