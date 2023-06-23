import { Storage } from "@plasmohq/storage";
import textStyle from "data-text:~cs-helpers/desktop/injected-style.scss";
import type { PlasmoCSConfig } from "plasmo";


import {
  OBSERVER_OPTIONS,
  SELECTORS,
  addGlobalEventListener,
  getIsExtensionEnabled,
  getVisibleElement
} from "~shared-scripts/ythd-utils";

const storageSync = new Storage({ area: "sync" });
let gObserverNavigation: MutationObserver;

let gTitleLast = document.title;
let gUrlLast = location.href;
let gElSupportSection: HTMLElement;

function addSupportButtonIfNeeded(): void {
  const elContainer = getVisibleElement(SELECTORS.relatedVideos);
  gElSupportSection = getVisibleElement(SELECTORS.donationSection);
  if (!elContainer || gElSupportSection) {
    return;
  }

  const CLASS_DONATION = SELECTORS.donationSection.substring(1);
  gElSupportSection = document.createElement("article");
  gElSupportSection.classList.add(CLASS_DONATION);
  gElSupportSection.innerHTML = `
      <section class="${CLASS_DONATION}__header">
        <h1 class="${CLASS_DONATION}__title">Support YouTube Auto HD</h1>
        <button class="${CLASS_DONATION}__close" aria-hidden="true" aria-label="Close">╳
        </button>
      </section>
      <p class="${CLASS_DONATION}__description">
        Hi there! Thank you so much for using my extension. I hope you enjoy using it as much as I enjoy making and maintaining it. I've been doing that for the past six years. Thanks for the many donations! :)
      </p>
      <p class="${CLASS_DONATION}__description">
        I work alone. There is no big fund behind or mandatory payments.
      </p>
      <p class="${CLASS_DONATION}__description">
        Your donations are what make it possible to keep it alive!
      </p>
      <p class="${CLASS_DONATION}__description">
        Please consider donating via <a href="https://paypal.me/avi12" target="_blank" class="yt-core-attributed-string__link" style="color: #3ea6ff">PayPal</a>. Any amount is appreciated :)
      </p>
  `;
  gElSupportSection.addEventListener("click", async ({ target }) => {
    const element = target as HTMLElement;
    if (element.matches("button, a")) {
      // If clicking either the close button or the link, this section will be permanently closed
      // Clicking the link will also open the donation link in a new tab
      await storageSync.set("isHideDonationSection", true);
    }
  });
  elContainer.prepend(gElSupportSection);
}

async function addTemporaryBodyListener(): Promise<void> {
  if (gTitleLast === document.title || gUrlLast === location.href || !(await getIsExtensionEnabled())) {
    return;
  }

  gTitleLast = document.title;
  gUrlLast = location.href;

  addSupportButtonIfNeeded();
}

function injectStyles(): void {
  const elStyle = document.createElement("style");
  elStyle.textContent = textStyle;
  document.head.append(elStyle);
}

async function init(): Promise<void> {
  const isHideDonationSection = await storageSync.get<boolean>("isHideDonationSection");
  if (isHideDonationSection) {
    return;
  }

  injectStyles();
  gObserverNavigation = await addGlobalEventListener(addTemporaryBodyListener);

  // When the user visits a /watch page, the support button
  // will be added if the user hasn't clicked on one yet
  new MutationObserver(async (_, observer) => {
    const elContainer = getVisibleElement(SELECTORS.relatedVideos);
    if (!(await getIsExtensionEnabled()) || !elContainer) {
      return;
    }

    observer.disconnect();

    addSupportButtonIfNeeded();
  }).observe(document, OBSERVER_OPTIONS);

  storageSync.watch({
    isHideDonationSection() {
      gObserverNavigation.disconnect();
      gElSupportSection?.remove();
    }
  });
}

init();

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*"]
};
