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
  prepareToChangeQuality();
}

async function saveLastClick({ target: element, isTrusted }) {
  //We use programatic clicks to change quality, but we need to save/respond only to user clicks.
  if (isTrusted) {
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
}

function addTemporaryBodyListener() {
  // Typically - listen to the player div (<video> container)
  // Otherwise, say it's a main channel page that has a channel trailer,
  // the <video> container wouldn't immediately exist, hence listen to the body
  const elementToListen = getElement("player") || document.body;

  // The ultimate fix for the "notification panel closes" issue
  // I don't know what it has to do with those classes, but it works
  const regexExit = /ytp-tooltip-title|ytp-time-current|ytp-bound-time-right/;
  const getIsExit = mutations =>
    Boolean(mutations[mutations.length - 1].target.className.match(regexExit));

  new MutationObserver((mutations, observer) => {
    if (getIsExit(mutations)) {
      return;
    }
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
    doVideoAction();
    elVideo.addEventListener("canplay", doVideoAction);
    observer.disconnect();
    return;
  }

  doVideoAction();
  addGlobalEventListener();

  observer.disconnect();
}).observe(document.body, gObserverOptions);
