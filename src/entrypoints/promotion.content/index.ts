import PromotionCard from "@/entrypoints/promotion.content/PromotionCard.svelte";
import { storeVideoTimeManager } from "@/lib/ythd-stores";
import { getElementByMutationObserver, getIsExtensionEnabled, getStorage, SELECTORS } from "@/lib/ythd-utils";
import { storage } from "#imports";
import { mount, unmount } from "svelte";

// The card is opt-in: it stays hidden until a page load finds every condition met, and dismissing it
// - by the close button or by opening the store - is terminal
enum PromotionState {
  hidden = "hidden",
  shown = "shown",
  dismissed = "dismissed"
}

// Video Time Manager mounts this into YouTube's masthead, so its presence means the user already has it
const SELECTOR_VIDEO_TIME_MANAGER = "vtm-trigger";

// It mounts a beat after the page settles, so a single later re-check avoids promoting to someone who has it
const VIDEO_TIME_MANAGER_SETTLE_MILLISECONDS = 3000;

// Nobody wants a pitch from an extension that hasn't earned anything yet, so the promotion waits out a few
// days of the extension quietly doing its job
const DAYS_BEFORE_PROMOTING = 3;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const FIRST_SEEN_UNRECORDED = 0;

async function getIsGracePeriodOver() {
  const firstSeenAt = await getStorage<number>({
    area: "sync",
    key: "promotionFirstSeenAt",
    fallback: FIRST_SEEN_UNRECORDED
  });
  if (firstSeenAt === FIRST_SEEN_UNRECORDED) {
    await storage.setItem("sync:promotionFirstSeenAt", Date.now());
    return false;
  }

  return Date.now() - firstSeenAt >= DAYS_BEFORE_PROMOTING * MILLISECONDS_PER_DAY;
}

function getHasVideoTimeManager() {
  return Boolean(document.querySelector(SELECTOR_VIDEO_TIME_MANAGER));
}

async function getHasVideoTimeManagerSettled() {
  if (getHasVideoTimeManager()) {
    return true;
  }

  await new Promise(resolve => setTimeout(resolve, VIDEO_TIME_MANAGER_SETTLE_MILLISECONDS));
  return getHasVideoTimeManager();
}

async function initPromotion(ctx: Parameters<typeof createShadowRootUi>[0]) {
  if (!storeVideoTimeManager) {
    return;
  }

  const [isExtensionEnabled, promotionState] = await Promise.all([
    getIsExtensionEnabled(),
    getStorage({
      area: "sync",
      key: "promotionState",
      fallback: PromotionState.hidden
    })
  ]);
  if (!isExtensionEnabled || promotionState === PromotionState.dismissed) {
    return;
  }

  if (!await getIsGracePeriodOver()) {
    return;
  }

  if (!document.querySelector(SELECTORS.promotionInjectParent)) {
    await getElementByMutationObserver(SELECTORS.promotionInjectParent, false);
  }

  if (await getHasVideoTimeManagerSettled()) {
    return;
  }

  await storage.setItem("sync:promotionState", PromotionState.shown);

  const promotionUi = await createShadowRootUi(ctx, {
    name: "ythd-promotion",
    position: "inline",
    // Sitting under YouTube's own sidebar ad rather than above it keeps the card from being read as one
    append(elAnchor, elPromotion) {
      const elAdSlot = elAnchor.querySelector(SELECTORS.sidebarAdSlot);
      if (elAdSlot) {
        elAdSlot.insertAdjacentElement("afterend", elPromotion);
        return;
      }

      elAnchor.prepend(elPromotion);
    },
    anchor: SELECTORS.promotionInjectParent,
    onMount: elContainer => mount(PromotionCard, {
      target: elContainer,
      props: {
        onDismiss() {
          void storage.setItem("sync:promotionState", PromotionState.dismissed);
          promotionUi.remove();
        }
      }
    }),
    onRemove: app => void unmount(app!)
  });

  promotionUi.mount();
}

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  cssInjectionMode: "ui",
  main: ctx => initPromotion(ctx)
});
