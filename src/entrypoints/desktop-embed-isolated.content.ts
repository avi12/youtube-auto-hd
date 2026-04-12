import { initial } from "@/lib/ythd-defaults";
import { embedMessenger, PlayerMessage } from "@/lib/ythd-player-messaging";
import { addStorageListeners, loadStorageValues } from "@/lib/ythd-storage-bridge";
import {
  getElementByMutationObserver,
  getIsExtensionEnabled,
  getVisibleElement,
  SELECTORS
} from "@/lib/ythd-utils";

function sendQualityToMainWorld() {
  void embedMessenger.sendMessage(
    PlayerMessage.APPLY_QUALITY,
    window.ythdLastUserQualities ?? initial.qualities
  );
}

async function init() {
  addStorageListeners(sendQualityToMainWorld);

  window.ythdExtEnabled = await getIsExtensionEnabled(window.ythdExtEnabled);
  if (!window.ythdExtEnabled) {
    return;
  }

  await loadStorageValues();

  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video)
    ?? await getElementByMutationObserver<HTMLVideoElement>(SELECTORS.video);

  if (elVideo.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
    await new Promise<void>(resolve => elVideo.addEventListener("canplay", () => resolve(), { once: true }));
  }

  sendQualityToMainWorld();
}

export default defineContentScript({
  matches: ["https://www.youtube.com/*", "https://www.youtube-nocookie.com/*"],
  includeGlobs: ["https://www.youtube.com/embed/*", "https://www.youtube-nocookie.com/embed/*"],
  allFrames: true,
  main: () => init()
});
