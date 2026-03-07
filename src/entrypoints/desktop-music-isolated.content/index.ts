import { initial } from "@/lib/ythd-defaults";
import { MusicMessage, musicMessenger } from "@/lib/ythd-music-messaging";
import type { QualityFpsPreferences } from "@/lib/ythd-types";
import {
  addGlobalEventListener,
  getIsExtensionEnabled,
  getStorage,
  getVisibleElement,
  OBSERVER_OPTIONS,
  SELECTORS
} from "@/lib/ythd-utils";
import { storage } from "#imports";

let isExtensionEnabled = false;
let isYouTubeMusicEnabled = false;
let gTitleLast = document.title;
let gUrlLast = location.href;

async function sendQualityToMainWorld() {
  const isSameQuality = await getStorage({
    area: "local",
    key: "isUseGlobalQualityPreferences",
    fallback: initial.isUseGlobalQualityPreferences
  });
  const qualitiesYouTube = await getStorage({
    area: "local",
    key: "qualities",
    fallback: initial.qualities
  });

  if (isSameQuality) {
    await musicMessenger.sendMessage(MusicMessage.APPLY_QUAILTY, qualitiesYouTube);
    return;
  }

  const qualitiesMusic = await getStorage({
    area: "local",
    key: "qualitiesMusic",
    fallback: qualitiesYouTube
  });
  await musicMessenger.sendMessage(MusicMessage.APPLY_QUAILTY, qualitiesMusic);
}

async function addTemporaryBodyListenerOnMusic() {
  if (!isExtensionEnabled || !isYouTubeMusicEnabled) {
    return;
  }

  if (gTitleLast === document.title && gUrlLast === location.href) {
    return;
  }

  gTitleLast = document.title;
  gUrlLast = location.href;

  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!elVideo) {
    return;
  }

  await sendQualityToMainWorld();
  elVideo.removeEventListener("canplay", sendQualityToMainWorld);
  elVideo.addEventListener("canplay", sendQualityToMainWorld, { once: true });
}

async function init() {
  await addGlobalEventListener(addTemporaryBodyListenerOnMusic);

  storage.watch<boolean>("local:isExtensionEnabled", async isExtEnabled => {
    isExtensionEnabled = isExtEnabled ?? false;
    if (!isExtEnabled || !isYouTubeMusicEnabled) {
      return;
    }
    await sendQualityToMainWorld();
  });

  storage.watch<QualityFpsPreferences>("local:qualities", async () => {
    if (!isExtensionEnabled || !isYouTubeMusicEnabled) {
      return;
    }
    await sendQualityToMainWorld();
  });

  storage.watch<QualityFpsPreferences>("local:qualitiesMusic", async () => {
    if (!isExtensionEnabled || !isYouTubeMusicEnabled) {
      return;
    }
    await sendQualityToMainWorld();
  });

  storage.watch<boolean>("local:isUseGlobalQualityPreferences", async () => {
    if (!isExtensionEnabled || !isYouTubeMusicEnabled) {
      return;
    }
    await sendQualityToMainWorld();
  });

  storage.watch<boolean>("local:isEnableYouTubeMusic", async isEnabled => {
    isYouTubeMusicEnabled = isEnabled ?? initial.isEnableYouTubeMusic;
    if (!isEnabled || !isExtensionEnabled) {
      return;
    }
    await sendQualityToMainWorld();
  });

  isYouTubeMusicEnabled = await getStorage({
    area: "local",
    key: "isEnableYouTubeMusic",
    fallback: initial.isEnableYouTubeMusic
  });
  isExtensionEnabled = await getIsExtensionEnabled();

  if (!isExtensionEnabled || !isYouTubeMusicEnabled) {
    return;
  }

  new MutationObserver(async (_, observer) => {
    const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
    if (!elVideo) {
      return;
    }

    observer.disconnect();
    await sendQualityToMainWorld();
    elVideo.addEventListener("canplay", sendQualityToMainWorld, { once: true });
  }).observe(document, OBSERVER_OPTIONS);
}

export default defineContentScript({
  matches: ["https://music.youtube.com/*"],
  main: () => init()
});
