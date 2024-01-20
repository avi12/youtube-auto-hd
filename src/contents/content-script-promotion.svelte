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

  const promotion = {
    chrome: "https://chrome.google.com/webstore/detail/fpoooibdndpjcnoodfionoeakeojdjaj",
    firefox: "https://addons.mozilla.org/en-US/firefox/addon/youtube-time-manager",
    opera: "https://addons.opera.com/en/extensions/details/youtube-time-manager"
  } as const;
</script>

{#if !isHidePromotionSection}
  <article class={CLASS_PROMOTION}>
    <h1 class="{CLASS_PROMOTION}__title">YouTube Auto HD</h1>

    <p class="{CLASS_PROMOTION}__description">
      Hi there! I've crafted something you might like – <a
            href={promotion[process.env.PLASMO_BROWSER] || promotion.chrome}
            target="_blank"
            class="{CLASS_PROMOTION}__link"
            on:click={hidePromotionSection}>YouTube Time
      Manager</a>. It's all about offering a breezy insight into your YouTube habits.
    </p>

    <button class="{CLASS_PROMOTION}__close" on:click={hidePromotionSection}>Don't show again</button>
  </article>
{/if}
