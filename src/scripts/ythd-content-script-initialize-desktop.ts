import { getVisibleElement, observerOptions } from "../shared-scripts/ythd-utilities";
import { resizePlayerIfNeeded } from "./ythd-content-script-resize";
import { prepareToChangeQualityOnDesktop } from "./ythd-content-script-functions-desktop";
import type { QualityFpsPreferences, VideoQuality } from "../types";

declare global {
  interface Window {
    ythdLastQualityClicked: VideoQuality | null;
    ythdLastUserQualities: QualityFpsPreferences;
    ythdPlayerObserver: MutationObserver;
  }
}

window.ythdLastQualityClicked = null;

let gTitleLast = document.title;
let gPlayerObserver: MutationObserver;

function addTemporaryBodyListenerOnDesktop(): void {
  // For some reason, the title observer will run as soon as .observe() calls,
  // so we need to prevent it
  if (gTitleLast === document.title) {
    return;
  }

  gTitleLast = document.title;

  // Typically - listen to the player div (<video> container)
  // Otherwise, say it's a main channel page that has a channel trailer,
  // the <video> container wouldn't immediately exist, hence listen to the document
  const elementToTrack = getVisibleElement<HTMLDivElement>("player") || document;

  if (!gPlayerObserver) {
    gPlayerObserver = new MutationObserver(mutations => {
      // The user has navigated to another page

      const elVideo = getVisibleElement<HTMLVideoElement>("video");
      if (getIsExit(mutations) || !elVideo) {
        return;
      }

      resizePlayerIfNeeded();

      // We need to reset global variables, as well as prepare to change the quality of the new video
      window.ythdLastQualityClicked = null;
      prepareToChangeQualityOnDesktop();
      elVideo.removeEventListener("canplay", prepareToChangeQualityOnDesktop);

      // Used to:
      // - Change the quality even if a pre-roll or a mid-roll ad is playing
      // - Change the quality if the video "refreshes", which happens when idling for a while (e.g. a couple of hours) and then resuming
      elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);

      gPlayerObserver.disconnect();
    });
  }

  gPlayerObserver.observe(elementToTrack, observerOptions);
}

// The ultimate fix for the "notification panel closes" issue
// I don't know what it has to do with those classes, but it works
const regexExit = /ytp-tooltip-title|ytp-time-current|ytp-bound-time-right/;
const getIsExit: (mutations: MutationRecord[]) => boolean = mutations => {
  const target = mutations[mutations.length - 1].target as HTMLDivElement;
  return Boolean(target.className.match(regexExit));
};

function addGlobalEventListenerOnDesktop(): void {
  // Fires when navigating to another page
  new MutationObserver(addTemporaryBodyListenerOnDesktop).observe(
    document.querySelector("title"),
    observerOptions
  );
}

function saveManualQualityChangeOnDesktop({ target, isTrusted }: MouseEvent): void {
  // We use programmatic clicks to change quality on desktop, but we need to save/respond only to user clicks
  if (!isTrusted) {
    return;
  }

  const element = target as HTMLElement;
  const elQuality = (() => {
    if (element.matches("span")) {
      return element;
    }
    if (element.matches("div")) {
      return element.querySelector("span");
    }
    return null;
  })();

  const quality = parseInt(elQuality?.textContent) as VideoQuality;
  if (!isNaN(quality)) {
    window.ythdLastQualityClicked = quality;
  }
}

new MutationObserver((_, observer) => {
  const elVideo = getVisibleElement<HTMLVideoElement>("video");
  const elPlayer = getVisibleElement<HTMLDivElement>("player");
  if (!elVideo || !elPlayer) {
    return;
  }

  observer.disconnect();

  elPlayer.addEventListener("click", saveManualQualityChangeOnDesktop);

  const isEmbed = location.pathname.startsWith("/embed/");
  if (!isEmbed) {
    prepareToChangeQualityOnDesktop();
    resizePlayerIfNeeded();
    elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
    addGlobalEventListenerOnDesktop();
    return;
  }

  if (!elVideo.paused) {
    prepareToChangeQualityOnDesktop();
  }
  elVideo.addEventListener("canplay", prepareToChangeQualityOnDesktop);
}).observe(document, observerOptions);
