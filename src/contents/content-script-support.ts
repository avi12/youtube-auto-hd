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
        <h1 class="${CLASS_DONATION}__title">YouTube Auto HD</h1>
        <button class="${CLASS_DONATION}__close" aria-hidden="true" aria-label="Close">╳
        </button>
      </section>
      <p class="${CLASS_DONATION}__description">
        Hi there,
      </p>
      <p class="${CLASS_DONATION}__description" style="margin-top: 10px;">
        As an Israeli citizen, I am currently facing the <a href="https://en.wikipedia.org/wiki/2023_Israel%E2%80%93Hamas_war" target="_blank" class="yt-core-attributed-string__link" style="color: #3ea6ff">worst war</a> in my country's history.
      </p>
      <p class="${CLASS_DONATION}__description">
        More than 1,000 innocent citizens have already been slaughtered by Hamas terrorists and more than a hundred citizens are being held in captivity in the Gaza Strip as of Oct 11, 2023.
      </p>
      <p class="${CLASS_DONATION}__description" style="margin-top: 10px;">
        In this time of crisis, your support can make a significant difference. Please consider donating via <a href="https://paypal.me/avi12" target="_blank" class="yt-core-attributed-string__link" style="color: #3ea6ff">PayPal</a> to help me secure basic necessities during this difficult period.
      </p>
      <p class="${CLASS_DONATION}__description">
        Alternatively, sharing information about what's happening here can also be incredibly impactful.
      </p>
      <p class="${CLASS_DONATION}__description" style="margin-top: 10px;">
        Thank you for taking the time to read this message and for any support you can provide.
      </p>
  `;
  gElSupportSection.addEventListener("click", async ({ target }) => {
    const element = target as HTMLElement;
    if (element.matches("button, a[href*=paypal]")) {
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
