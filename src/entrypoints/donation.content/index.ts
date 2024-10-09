import CsuiDonation from "@/entrypoints/donation.content/CsuiDonation.svelte";
import { getElementByMutationObserver, getIsExtensionEnabled, SELECTORS } from "@/lib/ythd-utils";

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const elementNameToInject = "ythd-donation";
    const elSupportSection = document.querySelector(elementNameToInject);
    const [elDonationParent, isEnabled] = await Promise.all([
      getElementByMutationObserver(SELECTORS.donationInjectParent),
      getIsExtensionEnabled()
    ]);
    if (!elDonationParent || !isEnabled || elSupportSection) {
      return;
    }

    const ui = await createShadowRootUi(ctx, {
      name: elementNameToInject,
      position: "inline",
      append: "first",
      anchor: SELECTORS.donationInjectParent,
      onMount: container => new CsuiDonation({ target: container }),
      onRemove: container => container?.$destroy()
    });

    ui.mount();
  }
});
