<script lang="ts">
  import { mdiHeartOutline, mdiStarOutline, mdiTranslate } from "@mdi/js";

  import Icon from "~popup/components/Icon.svelte";
  import { getI18n } from "~shared-scripts/ythd-utils";

  const i18n: { [key: string]: string } = {
    labelSubheader: getI18n("cj_i18n_06860", "Support developer"),
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
      icon: mdiStarOutline
    },
    {
      label: i18n.labelDonate,
      url: "https://paypal.me/avi12",
      icon: mdiHeartOutline
    },
    {
      label: i18n.labelTranslate,
      url: "https://apps.jeurissen.co/auto-hd-fps-for-youtube/translate",
      icon: mdiTranslate
    }
  ] as const;
</script>

<hr class="mt-6" />
<details class="mt-5">
  <summary class="mb-1 ms-[0.45rem] text-secondary cursor-pointer">
    <span class="ms-4">{i18n.labelSubheader}</span>
  </summary>
  <menu>
    {#each links as link}
      <li>
        <a class="link" href={link.url} on:click={e => chrome.tabs.create({ url: e.currentTarget.href })}>
          <Icon path={link.icon} />
          <span>{link.label}</span>
        </a>
      </li>
    {/each}
  </menu>
</details>

<style lang="scss">
  .text-secondary {
    color: var(--text-color-secondary);
  }

  .link {
    color: var(--text-color-promotion);
    text-decoration: none;
    display: inline-flex;
    align-items: center;

    span {
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

  :global(.rtl) {
    .link {
      span {
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

    li:not(:last-child) {
      margin-bottom: 0.5rem;
    }
  }
</style>
