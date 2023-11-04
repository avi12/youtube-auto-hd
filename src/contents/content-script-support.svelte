<script context="module" lang="ts">
  // noinspection TypeScriptCheckImport
  import textStyle from "data-text:~cs-helpers/desktop/injected-style.scss";
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

    anchor.element.prepend(shadowHost);
    mountState.observer.disconnect();
  };

  export const getStyle: PlasmoGetStyle = () => {
    const elStyle = document.createElement("style");
    elStyle.textContent = textStyle;
    return elStyle;
  };

  export const getInlineAnchor: PlasmoGetInlineAnchor = () => document.querySelector(SELECTORS.relatedVideos);

  const CLASS_DONATION = SELECTORS.donationSection.substring(1);
</script>

<script lang="ts">
  import { Storage } from "@plasmohq/storage";

  const storageSync = new Storage({ area: "sync" });

  let isHideDonationSection = true;

  storageSync.get<boolean>("isHideDonationSection").then(pIsHideDonationSection => {
    isHideDonationSection = pIsHideDonationSection;
  });

  storageSync.watch({
    isHideDonationSection({ newValue: pIsHideDonationSection }: { newValue: boolean }) {
      isHideDonationSection = pIsHideDonationSection;
    }
  });

  function hideDonationSection() {
    storageSync.set("isHideDonationSection", true);
  }
</script>

{#if !isHideDonationSection}
  <article class={CLASS_DONATION}>
    <section class="{CLASS_DONATION}__header">
      <h1 class="{CLASS_DONATION}__title">YouTube Auto HD</h1>
      <button class="{CLASS_DONATION}__close" on:click={hideDonationSection} aria-hidden="true" aria-label="Close">
        🞬
      </button>
    </section>

    <p class="{CLASS_DONATION}__description">Hi there,</p>
    <p class="{CLASS_DONATION}__description" style="margin-top: 10px;">
      If you've been enjoying this extension, you might be interested to know that maintaining this project requires
      both time and resources. Your support can make a significant difference.
    </p>
    <p class="{CLASS_DONATION}__description" style="margin-top: 10px;">
      To continue offering you a high-quality experience, a donation via <a
        href="https://paypal.me/avi12"
        target="_blank"
        class="yt-core-attributed-string__link"
        style="color: #3ea6ff"
        on:click={hideDonationSection}>PayPal</a> would be greatly appreciated. These contributions go directly into maintaining
      and improving this and future projects.
    </p>
    <p class="{CLASS_DONATION}__description" style="margin-top: 10px;">
      Thank you for your time and for considering this request. Your support helps keep it up and running.
    </p>
  </article>
{/if}
