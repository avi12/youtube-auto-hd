import { initial } from "@/lib/ythd-defaults";
import { PlayerMessage, musicMessenger } from "@/lib/ythd-player-messaging";
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
let cachedIsSameQuality = initial.isUseGlobalQualityPreferences;
let cachedQualitiesYouTube: QualityFpsPreferences = { ...initial.qualities };
let cachedQualitiesMusic: QualityFpsPreferences = { ...initial.qualities };
let gTitleLast = document.title;
let gUrlLast = location.href;

async function sendQualityToMainWorld() {
  cachedIsSameQuality = await getStorage({
    area: "local",
    key: "isUseGlobalQualityPreferences",
    fallback: cachedIsSameQuality
  });
  cachedQualitiesYouTube = await getStorage({
    area: "local",
    key: "qualities",
    fallback: cachedQualitiesYouTube
  });

  if (cachedIsSameQuality) {
    await musicMessenger.sendMessage(PlayerMessage.APPLY_QUALITY, cachedQualitiesYouTube);
    return;
  }

  cachedQualitiesMusic = await getStorage({
    area: "local",
    key: "qualitiesMusic",
    fallback: cachedQualitiesMusic
  });
  await musicMessenger.sendMessage(PlayerMessage.APPLY_QUALITY, cachedQualitiesMusic);
}

async function sendQualityIfEnabled() {
  if (!isExtensionEnabled || !isYouTubeMusicEnabled) {
    return;
  }
  await sendQualityToMainWorld();
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

  elVideo.removeEventListener("canplay", sendQualityToMainWorld);
  elVideo.addEventListener("canplay", sendQualityToMainWorld, { once: true });
}

async function init() {
  await addGlobalEventListener(addTemporaryBodyListenerOnMusic);

  storage.watch<boolean>("local:isExtensionEnabled", async isExtEnabled => {
    isExtensionEnabled = isExtEnabled ?? false;
    await sendQualityIfEnabled();
  });

  storage.watch("local:qualities", sendQualityIfEnabled);
  storage.watch("local:qualitiesMusic", sendQualityIfEnabled);
  storage.watch("local:isUseGlobalQualityPreferences", sendQualityIfEnabled);

  storage.watch<boolean>("local:isEnableYouTubeMusic", async isEnabled => {
    isYouTubeMusicEnabled = isEnabled ?? initial.isEnableYouTubeMusic;
    await sendQualityIfEnabled();
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
    elVideo.addEventListener("canplay", sendQualityToMainWorld, { once: true });
  }).observe(document, OBSERVER_OPTIONS);
}

export default defineContentScript({
  matches: ["https://music.youtube.com/*"],
  main: () => init()
});
