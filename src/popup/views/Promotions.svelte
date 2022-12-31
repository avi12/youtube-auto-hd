<script lang="ts">
  import { mdiHeart, mdiStar, mdiTranslate } from "@mdi/js";
  import { Icon, List, ListItem } from "svelte-materialify";
  import { getI18n } from "../../shared-scripts/ythd-utilities";

  const i18n: { [key: string]: string } = {
    labelSupport: getI18n("cj_i18n_06860", "Support developer"),
    labelRate: getI18n("cj_i18n_06861", "Rate extension"),
    labelDonate: getI18n("cj_i18n_00354", "Donate"),
    labelTranslate: getI18n("cj_i18n_01605", "Help with translations")
  };

  const linkRating: string = (() => {
    const extensionBaseUrl = chrome.runtime.getURL("");

    const isFirefox = extensionBaseUrl.startsWith("moz-extension://");
    if (isFirefox) {
      return "https://addons.mozilla.org/firefox/addon/youtube-auto-hd-fps";
    }

    const { userAgent } = navigator;

    const isOpera = userAgent.includes("OPR");
    if (isOpera) {
      return "https://addons.opera.com/extensions/details/app_id/afgnmkmomgakegdfoldjonhgkohhodol";
    }

    const isEdge = userAgent.includes("Edg");
    if (isEdge) {
      return "https://microsoftedge.microsoft.com/addons/detail/ggnepcoiimddpmjaoejhdfppjbcnfaom";
    }

    const isSafari = userAgent.match(/^((?!chrome|android).)*safari/i);
    if (isSafari) {
      return "https://apps.apple.com/app/id1546729687";
    }

    // Anything else, probably Google Chrome
    return "https://chrome.google.com/webstore/detail/fcphghnknhkimeagdglkljinmpbagone";
  })();

  const links: { label: string; url: string; icon: string }[] = [
    {
      label: i18n.labelRate,
      url: linkRating,
      icon: mdiStar
    },
    {
      label: i18n.labelDonate,
      url: "https://paypal.me/avi12",
      icon: mdiHeart
    },
    {
      label: i18n.labelTranslate,
      url: "https://apps.jeurissen.co/auto-hd-fps-for-youtube/translate",
      icon: mdiTranslate
    }
  ];

  function openUrl(url: string): void {
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
