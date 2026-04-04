import { storage } from "#imports";
import type { VideoAutoResize, VideoSize } from "@/lib/ythd-types";
import { initial } from "@/lib/ythd-defaults";
import {
  addGlobalEventListener,
  getIsExtensionEnabled,
  getVisibleElement,
  OBSERVER_OPTIONS,
  SELECTORS
} from "@/lib/ythd-utils";

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

function getCurrentViewMode(): VideoSize {
  // VORAPIS: button presence in DOM reveals current mode — controls may be auto-hidden so offsetWidth is unreliable
  if (document.querySelector(SELECTORS.sizeToggleLarge)) {
    return 0;
  }
  if (document.querySelector(SELECTORS.sizeToggleSmall)) {
    return 1;
  }
  // Regular YouTube: use the wide cookie
  return document.cookie.match(/wide=([10])/)?.[1] === "1" ? 1 : 0;
}

function resizePlayerIfNeeded() {
  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!preferences.isResizeVideo || !elVideo) {
    return;
  }

  const isVerticalVideo = elVideo.clientWidth <= elVideo.clientHeight;
  const shouldForceDefaultMode = preferences.isExcludeVertical && isVerticalVideo;
  const targetViewMode = shouldForceDefaultMode ? 0 : preferences.viewMode;

  if (getCurrentViewMode() !== targetViewMode) {
    getVisibleElement<HTMLButtonElement>(SELECTORS.sizeToggle)?.click();
  }
}

function setupVideoResizeListener(elVideo: HTMLVideoElement) {
  elVideo.removeEventListener("canplay", resizePlayerIfNeeded);
  elVideo.addEventListener("canplay", resizePlayerIfNeeded);
  if (elVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    resizePlayerIfNeeded();
  }
}

async function getPlayerSize() {
  const [isResizeVideo, size, isExcludeVertical] = await Promise.all([
    storage.getItem<VideoAutoResize>("sync:autoResize", { fallback: initial.isResizeVideo }),
    storage.getItem<VideoSize>("sync:size", { fallback: initial.size }),
    storage.getItem<boolean>("sync:isExcludeVertical", { fallback: initial.isExcludeVertical })
  ]);
  return { viewMode: size, isResizeVideo, isExcludeVertical };
}

function addTemporaryBodyListenerOnDesktop() {
  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!elVideo) {
    return;
  }
  setupVideoResizeListener(elVideo);
}

function addStorageListener() {
  storage.watch<boolean>("local:isExtensionEnabled", async isEnabled => {
    if (!isEnabled) {
      return;
    }
    preferences = { ...preferences, ...await getPlayerSize() };
    resizePlayerIfNeeded();
  });
  storage.watch<VideoAutoResize>("sync:autoResize", async isResizeVideo => {
    const isEnabled = await getIsExtensionEnabled();
    const isWatchPage = location.pathname === "/watch";
    if (!isEnabled || !isWatchPage) {
      return;
    }
    preferences.isResizeVideo = isResizeVideo ?? false;
    preferences.viewMode = await storage.getItem<VideoSize>("sync:size", { fallback: initial.size });
    resizePlayerIfNeeded();
  });
  storage.watch<VideoSize>("sync:size", async size => {
    const isEnabled = await getIsExtensionEnabled();
    const isWatchPage = location.pathname === "/watch";
    if (!isEnabled || !isWatchPage) {
      return;
    }
    preferences.viewMode = size ?? initial.size;
    preferences.isResizeVideo = await storage.getItem<VideoAutoResize>("sync:autoResize", {
      fallback: initial.isResizeVideo
    });
    preferences.isExcludeVertical = await storage.getItem<boolean>("sync:isExcludeVertical", {
      fallback: initial.isExcludeVertical
    });
    resizePlayerIfNeeded();
  });
  storage.watch<boolean>("sync:isExcludeVertical", async isExcludeVertical => {
    const isEnabled = await getIsExtensionEnabled();
    const isWatchPage = location.pathname === "/watch";
    if (!isEnabled || !isWatchPage) {
      return;
    }
    preferences.isExcludeVertical = isExcludeVertical ?? false;
    preferences.viewMode = await storage.getItem<VideoSize>("sync:size", { fallback: initial.size });
    resizePlayerIfNeeded();
  });
}

async function initPlayerResize() {
  addStorageListener();
  addGlobalEventListener(addTemporaryBodyListenerOnDesktop);

  if (!await getIsExtensionEnabled()) {
    return;
  }

  preferences = await getPlayerSize();

  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (elVideo) {
    setupVideoResizeListener(elVideo);
  } else {
    new MutationObserver((_, observer) => {
      const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
      if (!elVideo) {
        return;
      }
      observer.disconnect();
      setupVideoResizeListener(elVideo);
    }).observe(document, OBSERVER_OPTIONS);
  }
}

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  main: () => initPlayerResize()
});
