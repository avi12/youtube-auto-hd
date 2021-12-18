"use strict";

import {
  getElement,
  observerOptions,
  resizePlayerIfNeeded
} from "../shared-scripts/ythd-utilities";
import { prepareToChangeQuality } from "./ythd-content-script-functions";
import type { VideoQuality } from "../types";

declare global {
  interface Window {
    ythdLastQualityClicked: VideoQuality | null;
  }
}

let gPlayerObserver: MutationObserver;

function doVideoAction(): void {
  resizePlayerIfNeeded();
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

function addTemporaryBodyListener(): void {
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

      observer.disconnect();

      // We need to reset variables, some listeners and prepare to change the quality of the new video
      window.ythdLastQualityClicked = null;
      doVideoAction();
      elVideo.addEventListener("canplay", doVideoAction);
    });
  }

  gPlayerObserver.observe(elementToListen, observerOptions);
}

function addGlobalEventListener(): void {
  new MutationObserver(addTemporaryBodyListener).observe(
    document.querySelector("title"),
    observerOptions
  );
}

// The ultimate fix for the "notification panel closes" issue
// I don't know what it has to do with those classes, but it works
const regexExit = /ytp-tooltip-title|ytp-time-current|ytp-bound-time-right/;
const getIsExit: (mutations) => boolean = mutations =>
  Boolean(mutations[mutations.length - 1].target.className.match(regexExit));

// Run on page load
new MutationObserver((_, observer) => {
  const elVideo = getElement("video") as HTMLVideoElement;
  if (!elVideo) {
    return;
  }

  const isEmbed = location.pathname.startsWith("/embed/");

  getElement("player").addEventListener("click", saveManualQualityChange);

  if (isEmbed) {
    if (!elVideo.paused) {
      doVideoAction();
    }
    elVideo.addEventListener("canplay", doVideoAction);
    observer.disconnect();
    return;
  }

  doVideoAction();
  addGlobalEventListener();
  observer.disconnect();
}).observe(document, observerOptions);

export {};
