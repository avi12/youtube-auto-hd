<script lang="ts">
  import { mdiGithub, mdiHeartOutline, mdiStarOutline, mdiTranslate } from "@mdi/js";

  import { browser, storage } from "#imports";
  import Icon from "@/entrypoints/popup/components/Icon.svelte";
  import { isHideDonationSection } from "@/entrypoints/popup/states.svelte";
  import { getI18n } from "@/lib/ythd-utils";

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
    const extensionBaseUrl = browser.runtime.getURL("");

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
  const links: Array<PromotionalLink> = [
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

  $effect(() => {
    if (isHideDonationSection.value) {
      storage.setItem("sync:isHideDonationSection", isHideDonationSection.value);
    }
  });
</script>

<menu class="links-menu">
  {#each links as link (link.url)}
    <li>
      <a
        class="link"
        href={link.url}
        onclick={async e => {
          e.preventDefault();
          const { url } = link;
          if (url.includes("paypal.me")) {
            isHideDonationSection.value = true;
          }
          await browser.tabs.create({ url });
          close();
        }}>
        <Icon path={link.icon} />
        <span class="link-label">{link.label}</span>
      </a>
    </li>
  {/each}
</menu>

<style>
  .link {
    display: inline-flex;
    align-items: center;
    color: var(--text-color-promotion);
    text-decoration: none;

    & .link-label {
      position: relative;

      &::after {
        content: "";
        position: absolute;
        bottom: -3px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: currentColor;
        transition: transform 200ms ease-out;
        transform: scaleX(0);
        transform-origin: bottom right;
      }

      &:hover::after {
        transform: scaleX(1);
        transform-origin: bottom left;
      }
    }
  }

  /* noinspection CssUnusedSymbol */
  :global([dir="rtl"]) {
    & .link .link-label {
      &::after {
        transform-origin: bottom left;
      }

      &:hover::after {
        transform-origin: bottom right;
      }
    }
  }

  .links-menu {
    margin-bottom: 0;
    padding-inline-start: 0;
    list-style: none;

    & > :not(:last-child) {
      margin-bottom: 0.5rem;
    }
  }
</style>
