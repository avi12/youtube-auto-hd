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
