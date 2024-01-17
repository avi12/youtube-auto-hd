<script context="module" lang="ts">
  // noinspection TypeScriptCheckImport
  import cssText from "data-text:~cs-helpers/desktop/injected-style.scss";
  import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle, PlasmoMountShadowHost } from "plasmo";
  import { getIsExtensionEnabled, SELECTORS } from "~shared-scripts/ythd-utils";

  export const config: PlasmoCSConfig = {
    matches: ["https://www.youtube.com/*"]
  };

  export const mountShadowHost: PlasmoMountShadowHost = async ({ shadowHost, anchor, mountState }) => {
    const elSupportSection = document.querySelector(`#${CLASS_PROMOTION}`);
    if (!(await getIsExtensionEnabled()) || elSupportSection) {
      return;
    }

    anchor.element.insertAdjacentElement("afterbegin", shadowHost);
    mountState.observer.disconnect();
  };

  export const getStyle: PlasmoGetStyle = () => {
    const elStyle = document.createElement("style");
    elStyle.textContent = cssText;
    return elStyle;
  };

  export const getInlineAnchor: PlasmoGetInlineAnchor = () => document.querySelector(SELECTORS.promotionInjectParent);

  const CLASS_PROMOTION = SELECTORS.promotionSection.substring(1);
</script>

<script lang="ts">
  import { Storage } from "@plasmohq/storage";

  const storageSync = new Storage({ area: "sync" });

  let isHidePromotionSection = true;

  storageSync.get<boolean>("isHidePromotionSection").then(pIsHideDonationSection => {
    isHidePromotionSection = pIsHideDonationSection;
  });

  storageSync.watch({
    isHidePromotionSection({ newValue: pIsHideDonationSection }: { newValue: boolean }) {
      isHidePromotionSection = pIsHideDonationSection;
    }
  });

  function hidePromotionSection() {
    storageSync.set("isHidePromotionSection", true);
  }
</script>

{#if !isHidePromotionSection}
  <article class={CLASS_PROMOTION}>
    <section class="{CLASS_PROMOTION}__header">
      <h1 class="{CLASS_PROMOTION}__title">Hi there!</h1>
      <button class="{CLASS_PROMOTION}__close" on:click={hidePromotionSection} aria-hidden="true" aria-label="Close">
        🞬
      </button>
    </section>

    <p class="{CLASS_PROMOTION}__description">
      I've crafted something you might like – <a
            href="https://chrome.google.com/webstore/detail/youtube-time-manager/fpoooibdndpjcnoodfionoeakeojdjaj"
            target="_blank"
            class="yt-core-attributed-string__link"
            style="color: #3ea6ff"
            on:click={hidePromotionSection}>YouTube Time
      Manager</a>. It's all about offering a breezy insight into your YouTube habits.
    </p>
  </article>
{/if}
