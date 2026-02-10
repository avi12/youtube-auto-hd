import { storage } from "#imports";
import type { VideoAutoResize, VideoSize } from "@/lib/types";
import { initial } from "@/lib/ythd-setup";
import { addGlobalEventListener, getIsExtensionEnabled, getVisibleElement, SELECTORS } from "@/lib/ythd-utils";

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

function getCurrentViewMode() {
  const sizeCurrentMatch = document.cookie.match(/wide=([10])/);
  return sizeCurrentMatch ? (Number(sizeCurrentMatch[1]) as VideoSize) : 0;
}

async function resizePlayerIfNeeded() {
  const elSizeToggle = getVisibleElement<HTMLButtonElement>(SELECTORS.sizeToggle);
  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);

  if (!preferences.isResizeVideo || !elVideo || !elSizeToggle) {
    return;
  }

  const isVerticalVideo = elVideo.clientWidth <= elVideo.clientHeight;
  const shouldForceDefaultMode = preferences.isExcludeVertical && isVerticalVideo;

  const targetViewMode = shouldForceDefaultMode ? 0 : Number(preferences.viewMode);

  const isPrefersDefaultSize = targetViewMode === 0;
  const isPrefersTheaterSize = !isPrefersDefaultSize;

  while ((getCurrentViewMode() === 0 && isPrefersTheaterSize) || (getCurrentViewMode() === 1 && isPrefersDefaultSize)) {
    elSizeToggle.click();

    await new Promise(resolve => setTimeout(resolve, 100));
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

async function addTemporaryBodyListenerOnDesktop() {
  const elSize = document.querySelector<HTMLButtonElement>(SELECTORS.sizeToggle);
  if (!elSize) {
    return;
  }

  await resizePlayerIfNeeded();
}

function addStorageListener() {
  storage.watch<boolean>("local:isExtensionEnabled", async isEnabled => {
    if (!isEnabled) {
      return;
    }
    preferences = { ...preferences, ...(await getPlayerSize()) };
    await resizePlayerIfNeeded();
  });
  storage.watch<VideoAutoResize>("sync:autoResize", async isResizeVideo => {
    const isEnabled = await getIsExtensionEnabled();
    const isWatchPage = location.pathname === "/watch";
    if (!isEnabled || !isWatchPage) {
      return;
    }
    preferences.isResizeVideo = isResizeVideo as VideoAutoResize;
    preferences.viewMode = await storage.getItem<VideoSize>("sync:size", { fallback: initial.size });
    await resizePlayerIfNeeded();
  });
  storage.watch<VideoSize>("sync:size", async size => {
    const isEnabled = await getIsExtensionEnabled();
    const isWatchPage = location.pathname === "/watch";
    if (!isEnabled || !isWatchPage) {
      return;
    }
    preferences.viewMode = size as VideoSize;
    preferences.isResizeVideo = await storage.getItem<VideoAutoResize>("sync:autoResize", {
      fallback: initial.isResizeVideo
    });
    preferences.isExcludeVertical = await storage.getItem<boolean>("sync:isExcludeVertical", {
      fallback: initial.isExcludeVertical
    });
    await resizePlayerIfNeeded();
  });
  storage.watch<boolean>("sync:isExcludeVertical", async isExcludeVertical => {
    const isEnabled = await getIsExtensionEnabled();
    const isWatchPage = location.pathname === "/watch";
    if (!isEnabled || !isWatchPage) {
      return;
    }
    preferences.isExcludeVertical = isExcludeVertical as boolean;
    preferences.viewMode = await storage.getItem<VideoSize>("sync:size", { fallback: initial.size });
    await resizePlayerIfNeeded();
  });
}

async function initPlayerResize() {
  addStorageListener();
  addGlobalEventListener(addTemporaryBodyListenerOnDesktop);

  if (!(await getIsExtensionEnabled())) {
    return;
  }

  preferences = await getPlayerSize();

  await resizePlayerIfNeeded();
}

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  main: () => initPlayerResize()
});
