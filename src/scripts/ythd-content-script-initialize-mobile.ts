import { getVisibleElement, observerOptions, Selectors } from "../shared-scripts/ythd-utilities";
import { prepareToChangeQualityOnMobile } from "./ythd-content-script-functions-mobile";
import type { Label } from "../types";
import { labelToQuality } from "../shared-scripts/ythd-setup";

window.ythdLastQualityClicked = null;
let gTitleLast = document.title;
let gPlayerObserver: MutationObserver;

function addTemporaryBodyListenerOnMobile(): void {
  // For some reason, the title observer will run as soon as .observer() calls,
  // so we need to prevent it
  if (gTitleLast === document.title || document.title === "- YouTube") {
    return;
  }

  gTitleLast = document.title;

  if (!gPlayerObserver) {
    gPlayerObserver = new MutationObserver(async function temporaryBodyListener() {
      const elVideo = getVisibleElement<HTMLVideoElement>("video");
      if (!elVideo) {
        return;
      }

      gPlayerObserver.disconnect();

      // We need to reset the global variable, as well as prepare to change the quality of the new video
      window.ythdLastQualityClicked = null;
      await prepareToChangeQualityOnMobile();
      elVideo.removeEventListener("canplay", prepareToChangeQualityOnMobile);

      // Used to change the quality even if a pre-roll or a mid-roll ad is playing
      elVideo.addEventListener("canplay", prepareToChangeQualityOnMobile);
    });
  }

  gPlayerObserver.observe(document, observerOptions);
}

function addGlobalEventListenerOnMobile(): void {
  // Fires when navigating to another page
  new MutationObserver(addTemporaryBodyListenerOnMobile).observe(
    document.querySelector("title"),
    observerOptions
  );
}

function saveManualQualityChangeOnMobile({ target, isTrusted }: Event): void {
  // We use programmatic "onchange" to change quality on mobile, but we need to save/respond only to <select> onchange
  if (!isTrusted) {
    return;
  }

  const element = target as HTMLElement;
  if (!element.matches(Selectors.mobileQualityDropdownWrapper)) {
    return;
  }

  const elDropdownQuality = element.querySelector<HTMLSelectElement>(Selectors.mobileQualityDropdown);
  const label = elDropdownQuality.value as Label;
  window.ythdLastQualityClicked = labelToQuality[label];
}

function init(): void {
  addGlobalEventListenerOnMobile();
  document.addEventListener("change", saveManualQualityChangeOnMobile);

  new MutationObserver((_, observer) => {
    const elVideo = getVisibleElement<HTMLVideoElement>("video");
    observer.disconnect();
    if (elVideo) {
      prepareToChangeQualityOnMobile();
    }
  }).observe(document, observerOptions);
}

init();
