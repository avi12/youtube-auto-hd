import { Storage } from "@plasmohq/storage";
import type { PlasmoCSConfig } from "plasmo";


import { initial } from "~shared-scripts/ythd-setup";
import {
  SELECTORS,
  addGlobalEventListener,
  getIsExtensionEnabled,
  getVisibleElement
} from "~shared-scripts/ythd-utils";
import type { VideoAutoResize, VideoSize } from "~types";

const storageLocal = new Storage({ area: "local" });
const storageSync = new Storage({ area: "sync" });

let gOptions: {
  size: VideoSize;
  isResizeVideo: VideoAutoResize;
} = {
  size: initial.size,
  isResizeVideo: initial.isResizeVideo
};

function getCurrentSize(): VideoSize {
  const sizeCurrentMatch = document.cookie.match(/wide=([10])/);
  return sizeCurrentMatch ? (Number(sizeCurrentMatch[1]) as VideoSize) : 0;
}

async function resizePlayerIfNeeded(): Promise<void> {
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
    elSizeToggle.click();
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function getPlayerSize(): Promise<{ size: VideoSize; isResizeVideo: VideoAutoResize }> {
  const [size = initial.size, isResizeVideo = initial.isResizeVideo] = await Promise.all([
    storageSync.get<VideoSize>("size"),
    storageSync.get<VideoAutoResize>("autoResize")
  ]);
  return { size, isResizeVideo };
}

async function addTemporaryBodyListenerOnDesktop(): Promise<void> {
  const elSize = document.querySelector<SVGPathElement>(SELECTORS.pathSizeToggle);
  if (!elSize) {
    return;
  }

  await resizePlayerIfNeeded();
}

function addStorageListener(): void {
  storageLocal.watch({
    async isExtensionEnabled({ newValue: isEnabled }: { newValue: boolean }) {
      if (!isEnabled) {
        return;
      }
      gOptions = { ...gOptions, ...(await getPlayerSize()) };

      await resizePlayerIfNeeded();
    }
  });
  storageSync.watch({
    async size({ newValue: size }: { newValue: VideoSize }) {
      const isEnabled = await getIsExtensionEnabled();
      const isWatchPage = location.pathname === "/watch";
      if (!isEnabled || !isWatchPage) {
        return;
      }
      gOptions.size = size;
      gOptions.isResizeVideo ??= await storageSync.get<VideoAutoResize>("autoResize");

      await resizePlayerIfNeeded();
    },
    async autoResize({ newValue: isResizeVideo }: { newValue: VideoAutoResize }) {
      const isEnabled = await getIsExtensionEnabled();
      const isWatchPage = location.pathname === "/watch";
      if (!isEnabled || !isWatchPage) {
        return;
      }
      gOptions.isResizeVideo = isResizeVideo;
      gOptions.size ??= await storageSync.get<VideoSize>("size");

      await resizePlayerIfNeeded();
    }
  });
}

async function initPlayerResize(): Promise<void> {
  addStorageListener();
  addGlobalEventListener(addTemporaryBodyListenerOnDesktop);

  if (!(await getIsExtensionEnabled())) {
    return;
  }

  gOptions = await getPlayerSize();

  await resizePlayerIfNeeded();
}

initPlayerResize();

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*"]
};
