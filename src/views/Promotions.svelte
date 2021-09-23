<script>
  import {
    Icon,
    List,
    ListItem
  } from "svelte-materialify";
  import { mdiHeart, mdiStar, mdiTranslate } from "@mdi/js";

  import { getI18n } from "../yt-auto-hd-utilities";

  // prettier-ignore
  const i18n = {
    labelSupport: getI18n("cj_i18n_06860", "Support developer"),
    labelRate: getI18n("cj_i18n_06861", "Rate extension"),
    labelDonate: getI18n("cj_i18n_00354", "Donate"),
    labelTranslate: getI18n("cj_i18n_01605", "Help with translations")
  };

  const linkRating = (() => {
    const extensionBaseUrl = chrome.runtime.getURL("");

    // Mozilla Firefox
    if (extensionBaseUrl.startsWith("moz-extension://")) {
      return "https://addons.mozilla.org/firefox/addon/youtube-auto-hd-fps";
    }

    let userAgent = navigator.userAgent;

    // Opera
    if (userAgent.includes("OPR")) {
      return "https://addons.opera.com/extensions/details/app_id/afgnmkmomgakegdfoldjonhgkohhodol";
    }

    // Microsoft Edge
    if (userAgent.includes("Edg")) {
      return "https://microsoftedge.microsoft.com/addons/detail/youtube-auto-hd-fps/ggnepcoiimddpmjaoejhdfppjbcnfaom";
    }

    // Safari Mac & iOS
    if (/^((?!chrome|android).)*safari/i.test(userAgent)) {
      return "https://apps.apple.com/app/auto-hd-fps-for-youtube/id1546729687";
    }

    // Anything else, probably Google Chrome
    return "https://chrome.google.com/webstore/detail/youtube-auto-hd-+-fps/fcphghnknhkimeagdglkljinmpbagone";
  })();

  const links = [
    {
      label: i18n.labelRate,
      url: linkRating,
      icon: mdiStar
    },
    {
      label: i18n.labelDonate,
      url: "https://paypal.me/avi12/0usd",
      icon: mdiHeart
    },
    {
      label: i18n.labelTranslate,
      url: "https://apps.jeurissen.co/auto-hd-fps-for-youtube/translate",
      icon: mdiTranslate
    }
  ];

  function openUrl(url) {
    chrome.tabs.create({ url });
  }
</script>

<div class="mt-3">
  <div class="subheader">{i18n.labelSupport}</div>
  <List dense>
    {#each links as { label, url, icon }}
      <ListItem on:click={() => openUrl(url)}>
        <span slot="prepend"><Icon path={icon} class="red-text" /></span>
        <div class="text-subtitle-1">{label}</div>
      </ListItem>
    {/each}
  </List>
</div>
