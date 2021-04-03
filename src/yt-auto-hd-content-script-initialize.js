"use strict";

import { resizePlayerIfNeeded } from "./yt-auto-hd-utilities";
import { getElement, prepareToChangeQuality } from "./yt-auto-hd-content-script-functions";

const gObserverOptions = { childList: true, subtree: true };
window.ythdLastQualityClicked = null;

function doVideoAction() {
  resizePlayerIfNeeded();
  prepareToChangeQuality();
}

async function saveLastClick({ target: element }) {
  const elQuality = (() => {
    if (element.matches("span")) {
      return element;
    }
    if (element.matches("div")) {
      return element.querySelector("span");
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
  // Typically - listen to the player div (<video> container)
  // Otherwise, say it's a main channel page that has a channel trailer,
  // the <video> container wouldn't immediately exist, hence listen to the body
  const elementToListen = getElement("player") || document.body;
  new MutationObserver(async (_, observer) => {
    const elVideo = getElement("video");
    if (!elVideo) {
      return;
    }

    window.ythdLastQualityClicked = null;
    doVideoAction();
    elVideo.addEventListener("canplay", doVideoAction);
    observer.disconnect();
  }).observe(elementToListen, gObserverOptions);
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
