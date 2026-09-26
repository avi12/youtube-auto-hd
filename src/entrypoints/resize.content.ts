import { initial } from "@/lib/ythd-defaults";
import type { VideoAutoResize, VideoSize } from "@/lib/ythd-types";
import {
  addGlobalEventListener,
  getIsExtensionEnabled,
  getPlayerDiv,
  getVisibleElement,
  OBSERVER_OPTIONS,
  SELECTORS
} from "@/lib/ythd-utils";
import { storage } from "#imports";

const PREFERENCE_KEYS = [
  "local:isExtensionEnabled",
  "sync:autoResize",
  "sync:size",
  "sync:isExcludeVertical"
] as const;

// YouTube puts the size button in the DOM about a second before it wires up its click handler,
// so the first clicks are dropped without a trace
const VIEW_MODE_RETRY = {
  attempts: 10,
  milliseconds: 400
} as const;

interface Preferences {
  viewMode: VideoSize;
  isResizeVideo: VideoAutoResize;
  isExcludeVertical: boolean;
}

let preferences: Preferences = {
  viewMode: initial.size,
  isResizeVideo: initial.isResizeVideo,
  isExcludeVertical: initial.isExcludeVertical
};
let retryTimeout: ReturnType<typeof setTimeout> | undefined;

function getCurrentViewMode(): VideoSize {
  // VORAPIS: button presence in DOM reveals current mode — controls may be auto-hidden so offsetWidth is unreliable
  if (document.querySelector(SELECTORS.sizeToggleLarge)) {
    return 0;
  }

  if (document.querySelector(SELECTORS.sizeToggleSmall)) {
    return 1;
  }

  // Regular YouTube: the watch page's own attribute is the live state.
  // The "wide" cookie only records the account-wide preference and can disagree with the rendered
  // layout — a tab that loads in the background stays in default view while the cookie reads "1"
  const elWatchPage = document.querySelector(SELECTORS.watchPage);
  if (elWatchPage) {
    return elWatchPage.hasAttribute("theater") ? 1 : 0;
  }

  return document.cookie.match(/wide=([10])/)?.[1] === "1" ? 1 : 0;
}

// Every trigger funnels through here, so only one click can ever be in flight — two triggers in the
// same tick would otherwise click twice and toggle the player straight back
function resizePlayerIfNeeded() {
  clearTimeout(retryTimeout);
  let attemptsLeft = VIEW_MODE_RETRY.attempts;

  function attemptResize() {
    const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
    // Only a player that offers a size toggle can be resized, which is also what keeps this to watch
    // pages. Matched by presence rather than visibility, since the controls auto-hide during playback
    const elSizeToggle = elVideo && getPlayerDiv(elVideo)?.querySelector<HTMLButtonElement>(SELECTORS.sizeToggle);
    if (!preferences.isResizeVideo || !elVideo || !elSizeToggle) {
      return;
    }

    const isVerticalVideo = elVideo.clientWidth <= elVideo.clientHeight;
    const shouldForceDefaultMode = preferences.isExcludeVertical && isVerticalVideo;
    const targetViewMode = shouldForceDefaultMode ? 0 : preferences.viewMode;
    if (getCurrentViewMode() === targetViewMode) {
      return;
    }

    elSizeToggle.click();
    attemptsLeft -= 1;

    if (attemptsLeft > 0) {
      retryTimeout = setTimeout(attemptResize, VIEW_MODE_RETRY.milliseconds);
    }
  }

  retryTimeout = setTimeout(attemptResize);
}

function setupVideoResizeListener(elVideo: HTMLVideoElement) {
  elVideo.removeEventListener("canplay", resizePlayerIfNeeded);
  elVideo.addEventListener("canplay", resizePlayerIfNeeded);

  if (elVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    resizePlayerIfNeeded();
  }
}

function attachResizeListenerToPlayer() {
  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!elVideo) {
    return;
  }

  setupVideoResizeListener(elVideo);
}

async function getPlayerSize() {
  const [isResizeVideo, size, isExcludeVertical] = await Promise.all([
    storage.getItem<VideoAutoResize>("sync:autoResize", { fallback: initial.isResizeVideo }),
    storage.getItem<VideoSize>("sync:size", { fallback: initial.size }),
    storage.getItem<boolean>("sync:isExcludeVertical", { fallback: initial.isExcludeVertical })
  ]);
  return {
    viewMode: size,
    isResizeVideo,
    isExcludeVertical
  };
}

function addStorageListener() {
  async function refreshPreferences() {
    if (!await getIsExtensionEnabled()) {
      return;
    }

    preferences = await getPlayerSize();
    resizePlayerIfNeeded();
  }

  for (const key of PREFERENCE_KEYS) {
    storage.watch(key, () => void refreshPreferences());
  }
}

// A tab that loaded in the background holds a player that never fired "canplay", because YouTube
// waits for the tab to be shown before loading the media — so re-check when the user switches to it
function addVisibilityListener() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      return;
    }

    resizePlayerIfNeeded();
  });
}

async function initPlayerResize() {
  addStorageListener();
  addVisibilityListener();
  void addGlobalEventListener(attachResizeListenerToPlayer);

  if (!await getIsExtensionEnabled()) {
    return;
  }

  preferences = await getPlayerSize();

  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (elVideo) {
    setupVideoResizeListener(elVideo);
    return;
  }

  new MutationObserver((_, observer) => {
    const elVideoAdded = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
    if (!elVideoAdded) {
      return;
    }

    observer.disconnect();
    setupVideoResizeListener(elVideoAdded);
  }).observe(document, OBSERVER_OPTIONS);
}

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  main: () => initPlayerResize()
});
