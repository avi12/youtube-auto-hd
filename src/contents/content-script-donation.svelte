<script context="module" lang="ts">
  import cssText from "data-text:~cs-helpers/desktop/injected-style.scss";
  import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle, PlasmoMountShadowHost } from "plasmo";
  import { getIsExtensionEnabled, SELECTORS } from "~shared-scripts/ythd-utils";

  export const config: PlasmoCSConfig = {
    matches: ["https://www.youtube.com/*"]
  };

  export const mountShadowHost: PlasmoMountShadowHost = async ({ shadowHost, anchor, mountState }) => {
    const elSupportSection = document.querySelector(`#${CLASS_DONATION}`);
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

  export const getInlineAnchor: PlasmoGetInlineAnchor = () => document.querySelector(SELECTORS.donationInjectParent);

  const CLASS_DONATION = SELECTORS.donationSection.substring(1);
</script>

<script lang="ts">
  import { Storage } from "@plasmohq/storage";
  import type { initial } from "~shared-scripts/ythd-setup";

  const storageSync = new Storage({ area: "sync" });

  let isHideDonationSection = true;
  let isShowDismissButton = false;
  const timeoutShow = setTimeout(() => {
    isShowDismissButton = true;
  }, 5000);

  Promise.all([
    storageSync.get<typeof initial.isHidePromotionSection>("isHidePromotionSection"),
    storageSync.get<typeof initial.isHideDonationSection>("isHideDonationSection")
  ]).then(([pIsHidePromotionSection, pIsHideDonationSection]) => {
    isHideDonationSection = pIsHidePromotionSection || pIsHideDonationSection;
  });

  storageSync.watch({
    isHideDonationSection({ newValue: pIsHideDonationSection }: { newValue: boolean }) {
      isHideDonationSection = pIsHideDonationSection;
    }
  });

  function hideDonationSection() {
    clearTimeout(timeoutShow);
    storageSync.set("isHideDonationSection", true);
  }
</script>

{#if !isHideDonationSection}
  <article class={CLASS_DONATION}>
    <h1 class="{CLASS_DONATION}__title">YouTube Auto HD</h1>

    <p class="{CLASS_DONATION}__description">
      Please consider supporting me via <a
        href="https://paypal.me/avi12"
        target="_blank"
        class="{CLASS_DONATION}__link"
        on:click={hideDonationSection}>PayPal</a> :)
    </p>

    <button class="{CLASS_DONATION}__close {isShowDismissButton && `${CLASS_DONATION}__close--show`}" on:click={hideDonationSection}>Don't show again</button>
  </article>
{/if}
