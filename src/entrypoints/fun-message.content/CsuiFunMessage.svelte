<script lang="ts">
  import { slide } from "svelte/transition";
  import { storage } from "wxt/storage";
  import { initial } from "@/lib/ythd-setup";
  import { addGlobalEventListener, SELECTORS } from "@/lib/ythd-utils";

  let isHideDonationSection = $state<boolean>(initial.isHideDonationSection);
  let isHideFunMessageSection = $state<boolean>(initial.isHideFunMessageSection);
  let isShowDismissButton = $state<boolean>(false);

  let timeoutShow: ReturnType<typeof setTimeout>;

  // Intersection observer to show the dismiss button after 5 seconds
  new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) {
      return;
    }
    observer.disconnect();
    timeoutShow = setTimeout(() => {
      isShowDismissButton = true;
    }, 5000);
  }).observe(document.querySelector(SELECTORS.donationInjectParent)!);

  Promise.all([
    storage.getItem<typeof initial.isHidePromotionSection>("sync:isHidePromotionSection", {
      fallback: initial.isHidePromotionSection
    }),
    storage.getItem<typeof initial.isHideDonationSection>("sync:isHideDonationSection", {
      fallback: initial.isHideDonationSection
    }),
    storage.getItem<typeof initial.isHideFunMessageSection>("sync:isHideFunMessageSection", {
      fallback: initial.isHideFunMessageSection
    })
  ]).then(([pIsHidePromotionSection, pIsHideDonationSection, pIsHideFunMessageSection]) => {
    isHideDonationSection = pIsHidePromotionSection || pIsHideDonationSection;
    isHideFunMessageSection = pIsHideFunMessageSection;
  });

  storage.watch<typeof initial.isHideDonationSection>("sync:isHideDonationSection", pIsHideDonationSection => {
    isHideDonationSection = pIsHideDonationSection !== null ? pIsHideDonationSection : initial.isHideDonationSection;
  });

  storage.watch<typeof initial.isHideDonationSection>("sync:isHideFunMessageSection", pIsHideFunMessageSection => {
    isHideFunMessageSection =
      pIsHideFunMessageSection !== null ? pIsHideFunMessageSection : initial.isHideFunMessageSection;
  });

  function closeSections() {
    clearTimeout(timeoutShow);
    storage.setItems([
      {
        key: "sync:isHideDonationSection",
        value: true
      },
      {
        key: "sync:isHideFunMessageSection",
        value: true
      }
    ]);
  }

  let pathname = $state<string>(location.pathname);
  addGlobalEventListener(() => {
    pathname = location.pathname;
  });
</script>

{#if pathname === "/watch"}
  {#if !isHideFunMessageSection}
    <article class="ythd-fun-message">
      <h1 class="title">YouTube Auto HD</h1>
      <p class="description">Since it's March 14th, I wish you to have a happy Pi Day :)</p>
      {#if isShowDismissButton}
        <button class="close" transition:slide onclick={closeSections}>Close</button>
      {/if}
    </article>
  {:else if !isHideDonationSection}
    <article class="ythd-donation">
      <h1 class="title">YouTube Auto HD</h1>
      <p class="description">
        Please consider supporting me via <a
          href="https://paypal.me/avi12"
          target="_blank"
          class="link"
          onclick={closeSections}>PayPal</a> :)
      </p>
      {#if isShowDismissButton}
        <button class="close" transition:slide onclick={closeSections}>Don't show again</button>
      {/if}
    </article>
  {/if}
{/if}

<style>
  :global(body) {
    margin: 0;
  }

  .ythd-donation,
  .ythd-fun-message {
    background-color: var(--yt-spec-additive-background, rgba(0, 0, 0, 0.5));
    padding: 12px;
    margin-bottom: 10px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;

    & .title {
      color: var(--yt-spec-text-primary, #0f0f0f);
      margin: 0 0 4px 0;
      font-size: 1.4rem;
    }

    & .description {
      color: var(--yt-spec-text-secondary, #606060);
      margin: 0;
      font-size: 1.4rem;
      line-height: 1.8rem;
      margin-bottom: 10px;
    }

    & .link {
      color: var(--yt-spec-call-to-action, #3ea6ff);
      text-decoration: none;
    }

    & .close {
      color: var(--yt-spec-call-to-action, #3ea6ff);
      border: none;
      padding: 0;
      background: none;
      cursor: pointer;
      align-self: end;
    }
  }
</style>
