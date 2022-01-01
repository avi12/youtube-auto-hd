"use strict";

import { getElement, observerOptions } from "../shared-scripts/ythd-utilities";
import { prepareToChangeQuality } from "./ythd-content-script-functions";
import type { VideoQuality } from "../types";

declare global {
  interface Window {
    ythdLastQualityClicked: VideoQuality | null;
  }
}

window.ythdLastQualityClicked = null;

let gPlayerObserver: MutationObserver;
let titleLast = document.title;

function doVideoAction(): void {
  // resizePlayerIfNeeded();
  prepareToChangeQuality();
}

function saveManualQualityChange({ target, isTrusted }: MouseEvent): void {
  // We use programmatic clicks to change quality, but we need to save/respond only to user clicks
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

// The ultimate fix for the "notification panel closes" issue
// I don't know what it has to do with those classes, but it works
const regexExit = /ytp-tooltip-title|ytp-time-current|ytp-bound-time-right/;
const getIsExit: (mutations: MutationRecord[]) => boolean = mutations => {
  const target = mutations[mutations.length - 1].target as HTMLDivElement;
  return Boolean(target.className.match(regexExit));
};

function addTemporaryBodyListener(): void {
  // For some reason, the title observer will run as soon as .observe() calls,
  // so we need to prevent it
  if (titleLast === document.title) {
    return;
  }

  titleLast = document.title;

  // Typically - listen to the player div (<video> container)
  // Otherwise, say it's a main channel page that has a channel trailer,
  // the <video> container wouldn't immediately exist, hence listen to the document
  const elementToListen = getElement("player") || document;

  if (!gPlayerObserver) {
    gPlayerObserver = new MutationObserver((mutations, observer) => {
      // The user has navigated to another page

      const elVideo = getElement("video") as HTMLVideoElement;
      if (getIsExit(mutations) || !elVideo) {
        return;
      }

      // We need to reset variables, as well as prepare to change the quality of the new video
      window.ythdLastQualityClicked = null;
      doVideoAction();
      elVideo.addEventListener("canplay", doVideoAction);
      observer.disconnect();
    });
  }

  gPlayerObserver.observe(elementToListen, observerOptions);
}

function addGlobalEventListener(): void {
  // Fires when navigating to another page
  new MutationObserver(addTemporaryBodyListener).observe(
    document.querySelector("title"),
    observerOptions
  );
}

// Runs on page load
new MutationObserver((_, observer) => {
  const elVideo = getElement("video") as HTMLVideoElement;
  const elPlayer = getElement("player") as HTMLDivElement;
  if (!elVideo || !elPlayer) {
    return;
  }

  observer.disconnect();

  elPlayer.addEventListener("click", saveManualQualityChange);
  const isEmbed = location.pathname.startsWith("/embed/");
  if (!isEmbed) {
    doVideoAction();
    addGlobalEventListener();
    return;
  }

  if (!elVideo.paused) {
    doVideoAction();
  }
  elVideo.addEventListener("canplay", doVideoAction);
}).observe(document, observerOptions);
