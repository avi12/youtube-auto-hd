"use strict";

import { resizePlayerIfNeeded } from "./yt-auto-hd-utilities";
import {
  getElement,
  prepareToChangeQuality
} from "./yt-auto-hd-content-script-functions";

const gObserverOptions = { childList: true, subtree: true };
window.ythdLastQualityClicked = null;

function doVideoAction() {
  resizePlayerIfNeeded();
  prepareToChangeQuality(window.ythdLastQualityClicked);
}

/**
 * @param {HTMLElement} target
 */
async function saveLastClick({ target }) {
  const elQuality = (() => {
    if (target.matches("span")) {
      return target;
    }
    if (target.matches("div")) {
      return target.querySelector("span");
    }
    return null;
  })();
  const quality = parseInt(elQuality?.textContent);
  if (isNaN(quality)) {
    return;
  }
  window.ythdLastQualityClicked = quality;
}

function addTemporaryBodyListener() {
  new MutationObserver((_, observer) => {
    const elVideo = getElement("video");
    if (!elVideo) {
      return;
    }

    window.ythdLastQualityClicked = null;
    doVideoAction();
    elVideo.addEventListener("canplay", doVideoAction);
    observer.disconnect();
  }).observe(document.body, gObserverOptions);
}

function addGlobalEventListener() {
  new MutationObserver(addTemporaryBodyListener).observe(
    document.querySelector("title"),
    gObserverOptions
  );
}

// Run on initial page load
new MutationObserver((_, observer) => {
  const elVideo = getElement("video");
  if (!elVideo) {
    return;
  }
  const isEmbed = location.pathname.startsWith("/embed/");

  getElement("player").addEventListener("click", saveLastClick);

  if (isEmbed) {
    elVideo.addEventListener("canplay", doVideoAction);
    return;
  }

  doVideoAction();
  addGlobalEventListener();

  observer.disconnect();
}).observe(document.body, gObserverOptions);
