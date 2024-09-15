<script lang="ts">
  import { mdiGithub, mdiHeartOutline, mdiStarOutline, mdiTranslate } from "@mdi/js";
  import { Storage } from "@plasmohq/storage";
  import Icon from "~popup/components/Icon.svelte";
  import { isHideDonationSection } from "~popup/store";
  import { getI18n } from "~shared-scripts/ythd-utils";

  const storageSync = new Storage({ area: "sync" });

  const i18n: Record<string, string> = {
    labelRate: getI18n("cj_i18n_06861", "Rate extension"),
    labelDonate: getI18n("cj_i18n_00354", "Donate"),
    labelTranslate: getI18n("cj_i18n_01605", "Help with translations"),
    contact: getI18n("cj_i18n_07669", "Contact me")
  };

  const linkRatingMapper = {
    chrome: "https://chromewebstore.google.com/detail/fcphghnknhkimeagdglkljinmpbagone",
    firefox: "https://addons.mozilla.org/firefox/addon/youtube-auto-hd-fps",
    edge: "https://microsoftedge.microsoft.com/addons/detail/ggnepcoiimddpmjaoejhdfppjbcnfaom",
    opera: "https://addons.opera.com/extensions/details/app_id/afgnmkmomgakegdfoldjonhgkohhodol",
    safari: "https://apps.apple.com/app/id1546729687"
  };

  const browserName = (() => {
    const extensionBaseUrl = chrome.runtime.getURL("");

    const isFirefox = extensionBaseUrl.startsWith("moz-extension://");
    if (isFirefox) {
      return "firefox";
    }

    const { userAgent } = navigator;

    const isOpera = userAgent.includes("OPR");
    if (isOpera) {
      return "opera";
    }

    const isEdge = userAgent.includes("Edg");
    if (isEdge) {
      return "edge";
    }

    const isSafari = userAgent.match(/^((?!chrome|android).)*safari/i);
    if (isSafari) {
      return "safari";
    }

    return "chrome";
  })();

  type PromotionalLink = { label: string; url: string; icon: string };
  const links: PromotionalLink[] = [
    {
      label: i18n.contact,
      url: "https://github.com/avi12/youtube-auto-hd",
      icon: mdiGithub
    },
    {
      label: i18n.labelDonate,
      url: "https://paypal.me/avi12",
      icon: mdiHeartOutline
    },
    {
      label: i18n.labelRate,
      url: linkRatingMapper[browserName],
      icon: mdiStarOutline
    },
    {
      label: i18n.labelTranslate,
      url: "https://apps.jeurissen.co/auto-hd-fps-for-youtube/translate",
      icon: mdiTranslate
    }
  ];

  $: if ($isHideDonationSection) {
    storageSync.set("isHideDonationSection", $isHideDonationSection);
  }
</script>

<menu>
  {#each links as link}
    <li>
      <a
        class="link"
        href={link.url}
        on:click|preventDefault={async () => {
          const { url } = link;
          if (url.includes("paypal.me")) {
            $isHideDonationSection = true;
          }
          await chrome.tabs.create({ url });
          close();
        }}>
        <Icon path={link.icon} />
        <span>{link.label}</span>
      </a>
    </li>
  {/each}
</menu>

<style>
  .link {
    color: var(--text-color-promotion);
    text-decoration: none;
    display: inline-flex;
    align-items: center;

    & span {
      position: relative;

      &::after {
        content: "";
        position: absolute;
        width: 100%;
        height: 2px;
        transform: scaleX(0);
        bottom: -3px;
        left: 0;
        background-color: currentColor;
        transform-origin: bottom right;
        transition: transform 0.2s ease-out;
      }

      &:hover::after {
        transform: scaleX(1);
        transform-origin: bottom left;
      }
    }
  }

  /*noinspection CssUnusedSymbol*/
  :global(.rtl) {
    & .link {
      & span {
        &::after {
          transform-origin: bottom left;
        }

        &:hover::after {
          transform-origin: bottom right;
        }
      }
    }
  }

  menu {
    list-style: none;
    padding-inline-start: 0;
    margin-bottom: 0;

    & li:not(:last-child) {
      margin-bottom: 0.5rem;
    }
  }
</style>
