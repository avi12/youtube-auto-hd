<script context="module" lang="ts">
  import cssText from "data-text:~cs-helpers/desktop/injected-style.scss";
  import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle, PlasmoMountShadowHost } from "plasmo";
  import { getIsExtensionEnabled, SELECTORS } from "~shared-scripts/ythd-utils";

  export const config: PlasmoCSConfig = {
    matches: ["https://www.youtube.com/*"]
  };

  export const mountShadowHost: PlasmoMountShadowHost = async ({ shadowHost, anchor, mountState }) => {
    const elSupportSection = document.querySelector("#ythd-donation");
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
</script>

<script lang="ts">
  import { Storage } from "@plasmohq/storage";
  import type { initial } from "~shared-scripts/ythd-setup";

  const storageSync = new Storage({ area: "sync" });

  let isHideDonationSection = true;
  let isShowDismissButton = false;
  let timeoutShow: ReturnType<typeof setTimeout>;

  new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) {
      return;
    }
    observer.disconnect();
    timeoutShow = setTimeout(() => {
      isShowDismissButton = true;
    }, 5000);
  }).observe(document.querySelector(SELECTORS.donationInjectParent));

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
  <article class="ythd-donation">
    <h1 class="ythd-donation__title">YouTube Auto HD</h1>

    <p class="ythd-donation__description">
      Please consider supporting me via <a
        href="https://paypal.me/avi12"
        target="_blank"
        class="ythd-donation__link"
        on:click={hideDonationSection}>PayPal</a> :)
    </p>

    <button
      class="ythd-donation__close"
      class:ythd-donation__close--show={isShowDismissButton}
      on:click={hideDonationSection}>Don't show again</button>
  </article>
{/if}

<style lang="scss">
  .ythd-donation {
    background-color: var(--yt-spec-additive-background, rgba(0, 0, 0, 0.5));
    padding: 12px;
    margin-bottom: 10px;
    direction: ltr;
    border-radius: 8px;

    &__title {
      color: var(--yt-spec-text-primary, #0f0f0f);
      margin: 0 0 4px 0;
      font-size: 1.4rem;
    }

    &__description {
      color: var(--yt-spec-text-secondary, #606060);
      margin: 0;
      font-size: 1.4rem;
      line-height: 1.8rem;

      &:not(:last-child) {
        margin-bottom: 10px;
      }
    }

    &__link {
      color: var(--yt-spec-call-to-action, #3ea6ff);
      text-decoration: none;
    }

    &__close {
      color: var(--yt-spec-call-to-action, #3ea6ff);
      border: none;
      padding: 0;
      background: none;
      cursor: pointer;
      float: right;
      overflow: clip;
      max-height: 0;
      transition: max-height 1s ease-in-out;

      &--show {
        max-height: 100px;
      }
    }
  }
</style>
