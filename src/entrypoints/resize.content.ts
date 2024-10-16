import { storage } from "wxt/storage";
import { getValue } from "@/lib/shared-utils";
import type { VideoAutoResize, VideoSize } from "@/lib/types";
import { initial } from "@/lib/ythd-setup";
import {
  addGlobalEventListener,
  getIsExtensionEnabled,
  getVisibleElement,
  SELECTORS
} from "@/lib/ythd-utils";

let gOptions: {
  size: VideoSize;
  isResizeVideo: VideoAutoResize;
} = {
  size: initial.size,
  isResizeVideo: initial.isResizeVideo
};

function getCurrentSize() {
  const sizeCurrentMatch = document.cookie.match(/wide=([10])/);
  return sizeCurrentMatch ? (Number(sizeCurrentMatch[1]) as VideoSize) : 0;
}

async function resizePlayerIfNeeded() {
  const elSizePath = getVisibleElement(SELECTORS.player)?.querySelector<SVGPathElement>(SELECTORS.pathSizeToggle);
  if (!elSizePath) {
    return;
  }

  const selSizeButtonOld = "button";
  const selSizeButtonNew = SELECTORS.menuOption;
  const elSizeToggle = elSizePath.closest<HTMLButtonElement | HTMLDivElement>(
    `${selSizeButtonOld}, ${selSizeButtonNew}`
  );

  if (!gOptions.isResizeVideo) {
    return;
  }

  while (getCurrentSize() !== gOptions.size) {
    elSizeToggle?.click();
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function getPlayerSize() {
  let [size, isResizeVideo] = await Promise.all([
    storage.getItem<VideoSize>("sync:size", { fallback: initial.size }),
    storage.getItem<VideoAutoResize>("sync:autoResize", { fallback: initial.isResizeVideo })
  ]);
  size = getValue(size);
  isResizeVideo = getValue(isResizeVideo);
  return { size, isResizeVideo };
}

async function addTemporaryBodyListenerOnDesktop() {
  const elSize = document.querySelector<SVGPathElement>(SELECTORS.pathSizeToggle);
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
    gOptions = { ...gOptions, ...(await getPlayerSize()) };
    await resizePlayerIfNeeded();
  });
  storage.watch<VideoSize>("sync:size", async size => {
    const isEnabled = await getIsExtensionEnabled();
    const isWatchPage = location.pathname === "/watch";
    if (!isEnabled || !isWatchPage) {
      return;
    }
    gOptions.size = size as VideoSize;
    gOptions.isResizeVideo = await storage.getItem<VideoAutoResize>("sync:autoResize", {
      fallback: initial.isResizeVideo
    });
    await resizePlayerIfNeeded();
  });
  storage.watch<VideoAutoResize>("sync:autoResize", async isResizeVideo => {
    const isEnabled = await getIsExtensionEnabled();
    const isWatchPage = location.pathname === "/watch";
    if (!isEnabled || !isWatchPage) {
      return;
    }
    gOptions.isResizeVideo = isResizeVideo as VideoAutoResize;
    gOptions.size = await storage.getItem<VideoSize>("sync:size", { fallback: initial.size });
    await resizePlayerIfNeeded();
  });
}

async function initPlayerResize() {
  addStorageListener();
  addGlobalEventListener(addTemporaryBodyListenerOnDesktop);

  if (!(await getIsExtensionEnabled())) {
    return;
  }

  gOptions = await getPlayerSize();

  await resizePlayerIfNeeded();
}

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  main: () => initPlayerResize()
});
