import { storage } from "wxt/storage";
import type { VideoAutoResize, VideoSize } from "@/lib/types";
import { initial } from "@/lib/ythd-setup";
import { addGlobalEventListener, getIsExtensionEnabled, getVisibleElement, SELECTORS } from "@/lib/ythd-utils";

let preferences = {
  viewMode: initial.size as VideoSize,
  isResizeVideo: initial.isResizeVideo as VideoAutoResize,
  isExcludeVertical: initial.isExcludeVertical as boolean
};

function getCurrentViewMode() {
  const sizeCurrentMatch = document.cookie.match(/wide=([10])/);
  return sizeCurrentMatch ? (Number(sizeCurrentMatch[1]) as VideoSize) : 0;
}

async function resizePlayerIfNeeded() {
  const elSizeToggle = getVisibleElement<HTMLButtonElement>(SELECTORS.sizeToggle);
  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);

  if (!preferences.isResizeVideo) {
    return;
  }

  const isWidescreen = elVideo.clientWidth > elVideo.clientHeight;

  let viewModePreferred: VideoSize;
  if (preferences.isExcludeVertical) {
    if (isWidescreen) {
      viewModePreferred = preferences.viewMode;
    } else {
      viewModePreferred = 0;
    }
  } else {
    viewModePreferred = preferences.viewMode;
  }

  const viewModeCurrent = getCurrentViewMode();
  if (viewModeCurrent === viewModePreferred) {
    return;
  }

  while (getCurrentViewMode() !== viewModePreferred) {
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
