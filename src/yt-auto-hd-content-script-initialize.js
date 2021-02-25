"use strict";

import { resizePlayerIfNeeded } from "./yt-auto-hd-utilities";
import {
  getElement,
  prepareToChangeQuality,
} from "./yt-auto-hd-content-script-functions";

const gObserverOptions = { childList: true, subtree: true };

async function doVideoAction(e) {
  resizePlayerIfNeeded();
  const isSucceeded = await prepareToChangeQuality(true);
  if (isSucceeded && e) {
    e.target.removeEventListener("canplay", doVideoAction);
  }
}

function addTemporaryBodyListener() {
  new MutationObserver((_, observer) => {
    const elVideo = getElement("video");
    if (!elVideo) {
      return;
    }

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

  if (isEmbed) {
    elVideo.addEventListener("canplay", doVideoAction);
    return;
  }

  doVideoAction();
  addGlobalEventListener();

  observer.disconnect();
}).observe(document.body, gObserverOptions);
