<script>
  import { getI18n } from "../yt-auto-hd-utilities";

  export let statesPromotion;

  // prettier-ignore
  const i18n = {
    labelLikeHeader: getI18n("cj_i18n_06657", "Like this extension?"),
    labelRate: getI18n("cj_i18n_06658", "Please rate 5 stars!"),
    labelAlsoSupport: getI18n("cj_i18n_06660", "Also, consider supporting the development!"),
    labelSupport: getI18n("cj_i18n_06659", "Consider supporting the development!"),
    labelTranslate: getI18n("cj_i18n_02173", "Wanna help translate?")
  };

  const browser = (() => {
    const extensionBaseUrl = chrome.runtime.getURL("");
    if (extensionBaseUrl.startsWith("moz-extension://")) {
      return "firefox";
    }
    const { userAgent } = navigator;
    if (userAgent.includes("OPR")) {
      return "opera";
    }
    if (userAgent.includes("Edg")) {
      return "edge";
    }
    return "chrome";
  })();

  const linkRating = (() => {
    // prettier-ignore
    const urls = {
      chrome: `https://chrome.google.com/webstore/detail/${getI18n("@@extension_id")}`,
      firefox: "https://addons.mozilla.org/firefox/addon/youtube-auto-hd-fps",
      opera: "https://addons.opera.com/en/extensions/details/youtube-auto-hd-fps",
      edge: `https://microsoftedge.microsoft.com/addons/detail/${getI18n("@@extension_id")}`
    };

    return urls[browser];
  })();

  function openUrl({ target: { href, dataset } }) {
    if (!href) {
      return;
    }

    chrome.tabs.create({ url: href });
    const { link } = dataset;
    statesPromotion[link] = false;
  }

  $: {
    chrome.storage.sync.set({
      rateDisplay: statesPromotion.isDisplayRateOffer
    });
  }

  $: {
    chrome.storage.sync.set({
      isOfferTranslation: statesPromotion.isDisplayTranslationOffer
    });
  }

  $: {
    chrome.storage.sync.set({
      isOfferDonation: statesPromotion.isDisplaySupportOffer
    });
  }
</script>

<style>
  .link {
    color: #00f;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    border-bottom: 1px solid transparent;
    transition: 0.25s;
    font-family: Arial, sans-serif;
  }

  .link:hover,
  .link:focus {
    color: #008800;
    border-bottom: 1px solid;
  }

  a {
    color: #00f;
  }

  .parent {
    font-size: 17px;
    text-align: center;
  }
</style>

<div class="parent" on:click={openUrl}>
  {#if statesPromotion.isDisplayRateOffer || statesPromotion.isDisplaySupportOffer}
    <div class="margin-vertical">
      <div>{i18n.labelLikeHeader}</div>
      {#if statesPromotion.isDisplayRateOffer}
        <!--suppress HtmlUnknownTarget -->
        <div>
          <!--suppress HtmlUnknownTarget -->
          <a class="link" data-link="isDisplayRateOffer" href={linkRating}>
            {i18n.labelRate}
          </a>
        </div>
      {/if}
      {#if statesPromotion.isDisplaySupportOffer}
        <a
          class="link"
          data-link="isDisplaySupportOffer"
          href="https://paypal.me/avi12">
          {statesPromotion.isDisplayRateOffer ? i18n.labelAlsoSupport : i18n.labelSupport}
        </a>
      {/if}
    </div>
  {/if}

  {#if statesPromotion.isDisplayTranslationOffer}
    <div class="margin-vertical">
      <a
        href="https://apps.jeurissen.co/auto-hd-fps-for-youtube/translate"
        class="link"
        data-link="isDisplayTranslationOffer">
        {i18n.labelTranslate}
      </a>
    </div>
  {/if}
</div>
