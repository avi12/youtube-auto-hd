import { mdiHeartOutline } from "@mdi/js";
import { Storage } from "@plasmohq/storage";
import type { PlasmoCSConfig } from "plasmo";


import { initial } from "~shared-scripts/ythd-setup";
import {
  SELECTORS,
  addGlobalEventListener,
  getStorage,
  getVisibleElement,
  getVisibleElementInList
} from "~shared-scripts/ythd-utils";

const storageSync = new Storage({ area: "sync" });
let observer: MutationObserver;

let gTitleLast = document.title;
let gUrlLast = location.href;

let gVideoCount = 0;
const MAX_COUNT = 5;

function addSupportButtonIfNeeded(): void {
  const elContainer = getVisibleElement(SELECTORS.actionButtonsContainer);
  let elSupportButton = getVisibleElementInList(document.getElementsByClassName(SELECTORS.donationSection.substring(1)));
  if (!elContainer || elSupportButton) {
    return;
  }

  elSupportButton = document.createElement("ytd-button-renderer");
  elSupportButton.style.marginInlineStart = "8px";
  elSupportButton.classList.add(SELECTORS.donationSection.substring(1), "ytd-menu-renderer");
  elSupportButton.innerHTML = `<yt-button-shape></yt-button-shape>`;
  elSupportButton.addEventListener("click", async () => {
    await storageSync.set("isHideDonationSection", true);
    elSupportButton.remove();
  });
  elContainer.append(elSupportButton);

  const elButtonShape = elSupportButton.querySelector<HTMLDivElement>("yt-button-shape");
  elButtonShape.insertAdjacentHTML(
    "beforeend",
    `
    <a href="https://paypal.me/avi12" target="_blank" class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading">
      <div class="yt-spec-button-shape-next__icon" aria-hidden="true">
        <yt-icon style="width: 24px; height: 25px;"></yt-icon>
      </div>
      <div><span>Support YTHD</span></div>
    </a>
    `
  );
  elSupportButton.querySelector("yt-icon").insertAdjacentHTML(
    "beforeend",
    `
      <div style="width: 100%; height: 100%; fill: currentcolor;">
        <yt-icon-shape class="style-scope yt-icon"></yt-icon-shape>
      </div>
    `
  );
  elSupportButton.querySelector("yt-icon-shape").insertAdjacentHTML(
    "beforeend",
    `
      <shape-icon>
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="pointer-events: none; display: block; width: 100%; height: 100%;">
            <path d="${mdiHeartOutline}"></path>
          </svg>
        </div>
      </shape-icon>
    `
  );
}

async function addTemporaryBodyListener(): Promise<void> {
  const isExtensionEnabled = await getStorage({
    area: "local",
    key: "isExtensionEnabled",
    updateWindowKey: "ythdExtEnabled",
    fallback: initial.isExtensionEnabled
  });
  if (isExtensionEnabled === false) {
    return;
  }

  if (gTitleLast === document.title || gUrlLast === location.href) {
    return;
  }

  gTitleLast = document.title;
  gUrlLast = location.href;

  if (gVideoCount < MAX_COUNT) {
    gVideoCount++;
    return;
  }

  addSupportButtonIfNeeded();
}

async function init(): Promise<void> {
  const isHideDonationSection = await storageSync.get<boolean>("isHideDonationSection");
  if (isHideDonationSection) {
    return;
  }

  observer = await addGlobalEventListener(addTemporaryBodyListener);

  storageSync.watch({
    isHideDonationSection() {
      observer.disconnect();
    }
  });
}

init();

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*"]
};
