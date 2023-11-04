<script lang="ts">
  import { mdiHeartOutline, mdiStarOutline, mdiTranslate } from "@mdi/js";

  import { Storage } from "@plasmohq/storage";

  import Icon from "~popup/components/Icon.svelte";
  import { isHideDonationSection } from "~popup/store";
  import { getI18n } from "~shared-scripts/ythd-utils";

  const storageSync = new Storage({ area: "sync" });

  const i18n: { [key: string]: string } = {
    labelRate: getI18n("cj_i18n_06861", "Rate extension"),
    labelDonate: getI18n("cj_i18n_00354", "Donate"),
    labelTranslate: getI18n("cj_i18n_01605", "Help with translations")
  };

  const linkRatingMapper = {
    chrome: "https://chrome.google.com/webstore/detail/fcphghnknhkimeagdglkljinmpbagone",
    firefox: "https://addons.mozilla.org/firefox/addon/youtube-auto-hd-fps",
    edge: "https://microsoftedge.microsoft.com/addons/detail/ggnepcoiimddpmjaoejhdfppjbcnfaom",
    opera: "https://addons.opera.com/extensions/details/app_id/afgnmkmomgakegdfoldjonhgkohhodol",
    safari: "https://apps.apple.com/app/id1546729687"
  };

  type PromotionalLink = { label: string; url: string; icon: string };
  const links: PromotionalLink[] = [
    {
      label: i18n.labelDonate,
      url: "https://paypal.me/avi12",
      icon: mdiHeartOutline
    },
    {
      label: i18n.labelRate,
      url: linkRatingMapper[process.env.PLASMO_BROWSER],
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
        on:click={async e => {
          const { url } = link;
          if (url.includes("paypal.me")) {
            $isHideDonationSection = true;
          }
          await chrome.tabs.create({ url });
          e.preventDefault();
          close();
        }}>
        <Icon path={link.icon} />
        <span>{link.label}</span>
      </a>
    </li>
  {/each}
</menu>

<style lang="scss">
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
