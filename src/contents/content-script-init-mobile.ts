import type { PlasmoCSConfig } from "plasmo";

import {
  prepareToChangeQualityOnMobile,
  saveManualQualityChangeOnMobile
} from "~cs-helpers/mobile/content-script-mobile";
import {
  addGlobalEventListener,
  addStorageListener,
  getElementByMutationObserver,
  getIsExtensionEnabled,
  getVisibleElement,
  OBSERVER_OPTIONS,
  SELECTORS,
  toggleMobileModal
} from "~shared-scripts/ythd-utils";
import textStyle from "data-text:~cs-helpers/mobile/injected-style.scss";

window.ythdLastQualityClicked = null;
let gTitleLast = document.title;
let gPlayerObserver: MutationObserver;

function injectStyles(): void {
  const elStyle = document.createElement("style");
  elStyle.textContent = textStyle;
  document.head.append(elStyle);
}

function addTemporaryBodyListenerOnMobile(): void {
  // For some reason, the title observer will run as soon as .observer() calls,
  // so we need to prevent it
  if (gTitleLast === document.title) {
    return;
  }

  // When changing a URL, often the title will change more than once,
  // so we need to ignore any multiple changes in a row
  if (document.title === "- YouTube") {
    return;
  }

  gTitleLast = document.title;

  if (!gPlayerObserver) {
    gPlayerObserver = new MutationObserver(async () => {
      const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
      if (!elVideo) {
        return;
      }

      gPlayerObserver.disconnect();

      window.ythdLastQualityClicked = null;
      toggleMobileModal(false);
      elVideo.removeEventListener("canplay", prepareToChangeQualityOnMobile);
      elVideo.addEventListener("canplay", prepareToChangeQualityOnMobile);
    });
  }

  gPlayerObserver.observe(document, OBSERVER_OPTIONS);
}

async function initMobile(): Promise<void> {
  await addGlobalEventListener(addTemporaryBodyListenerOnMobile);
  addStorageListener();

  if (!(await getIsExtensionEnabled())) {
    return;
  }

  injectStyles();

  document.addEventListener("change", saveManualQualityChangeOnMobile, { capture: true });

  if (!location.pathname.startsWith("/watch")) {
    return;
  }

  // When the user visits a /watch page, the video's quality will be changed as soon as it loads
  new MutationObserver((_, observer) => {
    const elVideo = document.querySelector<HTMLVideoElement>(SELECTORS.video);
    const isPlayable = Boolean(elVideo.src);
    if (isPlayable) {
      elVideo.addEventListener("canplay", prepareToChangeQualityOnMobile, { once: true });
      observer.disconnect();
    }
  }).observe(document, OBSERVER_OPTIONS);
}

initMobile();

export const config: PlasmoCSConfig = {
  matches: ["https://m.youtube.com/*"]
};
