import { initial } from "@/lib/ythd-defaults";
import { musicMessenger, PlayerMessage } from "@/lib/ythd-player-messaging";
import {
  addGlobalEventListener,
  getIsExtensionEnabled,
  getStorage,
  getVisibleElement,
  OBSERVER_OPTIONS,
  SELECTORS
} from "@/lib/ythd-utils";
import { storage } from "#imports";

let lastIsExtensionEnabled: boolean = initial.isExtensionEnabled;
let lastIsYouTubeMusicEnabled: boolean = initial.isEnableYouTubeMusic;
let lastIsSameQuality = initial.isUseGlobalQualityPreferences;
let lastQualitiesYouTube = { ...initial.qualities };
let lastQualitiesMusic = { ...initial.qualities };
let gTitleLast = document.title;
let gUrlLast = location.href;

async function sendQualityToMainWorld() {
  lastIsSameQuality = await getStorage({
    area: "local",
    key: "isUseGlobalQualityPreferences",
    fallback: lastIsSameQuality
  });
  lastQualitiesYouTube = await getStorage({
    area: "local",
    key: "qualities",
    fallback: lastQualitiesYouTube
  });

  if (lastIsSameQuality) {
    void musicMessenger.sendMessage(PlayerMessage.APPLY_QUALITY, lastQualitiesYouTube);
    return;
  }

  lastQualitiesMusic = await getStorage({
    area: "local",
    key: "qualitiesMusic",
    fallback: lastQualitiesMusic
  });
  void musicMessenger.sendMessage(PlayerMessage.APPLY_QUALITY, lastQualitiesMusic);
}

function sendQualityIfEnabled() {
  if (!lastIsExtensionEnabled || !lastIsYouTubeMusicEnabled) {
    return;
  }
  void sendQualityToMainWorld();
}

function addTemporaryBodyListenerOnMusic() {
  if (!lastIsExtensionEnabled || !lastIsYouTubeMusicEnabled) {
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
  void addGlobalEventListener(addTemporaryBodyListenerOnMusic);

  storage.watch<boolean>("local:lastIsExtensionEnabled", isExtEnabled => {
    lastIsExtensionEnabled = isExtEnabled ?? false;
    sendQualityIfEnabled();
  });

  storage.watch("local:qualities", sendQualityIfEnabled);
  storage.watch("local:qualitiesMusic", sendQualityIfEnabled);
  storage.watch("local:isUseGlobalQualityPreferences", sendQualityIfEnabled);

  storage.watch<boolean>("local:isEnableYouTubeMusic", isEnabled => {
    lastIsYouTubeMusicEnabled = isEnabled ?? initial.isEnableYouTubeMusic;
    sendQualityIfEnabled();
  });

  lastIsYouTubeMusicEnabled = await getStorage({
    area: "local",
    key: "isEnableYouTubeMusic",
    fallback: lastIsYouTubeMusicEnabled
  });
  lastIsExtensionEnabled = await getIsExtensionEnabled(lastIsExtensionEnabled);

  if (!lastIsExtensionEnabled || !lastIsYouTubeMusicEnabled) {
    return;
  }

  new MutationObserver((_, observer) => {
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
