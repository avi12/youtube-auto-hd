import {
  getElementByMutationObserver,
  getStorage,
  getVisibleElement,
  Selectors
} from "../shared-scripts/ythd-utilities";

function getDonationSection(): HTMLElement {
  const elSection = document.createElement("article");
  elSection.classList.add("ythd-donation-section");
  elSection.innerHTML = `
    <section class="ythd-donation-section__header">
      <h1 class="ythd-donation-section__title">Support YouTube Auto HD</h1>
      <button class="ythd-donation-section__close-btn" aria-hidden="true" aria-label="Close">╳</button>
    </section>
    <p class="ythd-donation-section__description">This extension is free but it takes a lot of work to maintain it</p>
    <p class="ythd-donation-section__description">Please consider supporting me via <a href="https://paypal.me/avi12" class="yt-formatted-string yt-simple-endpoint" target="_blank">PayPal</a> :)</p>
  `;

  function closeSection(): void {
    chrome.storage.sync.set({ isHideDonationSection: true });
    elSection.remove();
  }

  elSection.querySelector(".ythd-donation-section__close-btn").addEventListener("click", closeSection);
  elSection.querySelector("a").addEventListener("click", closeSection);

  return elSection;
}

let gVideoCount = 0;
let gIsHide = false;

export async function injectDonationSectionWhenNeeded(): Promise<void> {
  try {
    gIsHide = await getStorage("sync", "isHideDonationSection");
    // eslint-disable-next-line no-empty
  } catch {}
  if (gIsHide) {
    return;
  }

  gVideoCount++;

  const elContainer = await getElementByMutationObserver(Selectors.relatedVideos);
  if (!elContainer) {
    return;
  }

  if (gVideoCount <= 5) {
    const elDonationSection = getVisibleElement(Selectors.donationSection);
    elDonationSection?.remove();
    return;
  }

  gVideoCount = 0;

  elContainer.prepend(getDonationSection());
}
