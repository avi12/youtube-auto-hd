<script lang="ts">
  import { storeVideoTimeManager } from "@/lib/ythd-stores";
  import { mdiClose } from "@mdi/js";

  interface Props {
    onDismiss: () => void;
  }

  const { onDismiss }: Props = $props();

  // Long enough for the message to be read rather than swatted away on reflex
  const DISMISS_UNLOCK_MILLISECONDS = 10000;
  // Counting only once the card is genuinely on screen keeps the wait from expiring while it's scrolled past
  const VISIBILITY_RATIO = 0.6;
  const CLOSE_ICON_SIZE = 24;
  // YouTube flags its dark theme here, and its own design tokens are no longer readable custom properties
  const ATTRIBUTE_DARK_THEME = "dark";

  const store = storeVideoTimeManager!;

  let elCard = $state<HTMLElement>();
  let isRevealed = $state(false);
  let isDismissable = $state(false);
  let isDarkTheme = $state(document.documentElement.hasAttribute(ATTRIBUTE_DARK_THEME));

  const dismissLabel = $derived(isDismissable ? "Don't show again" : "Dismiss in a moment");
  $effect(() => {
    const observer = new MutationObserver(() => {
      isDarkTheme = document.documentElement.hasAttribute(ATTRIBUTE_DARK_THEME);
    });

    observer.observe(document.documentElement, { attributeFilter: [ATTRIBUTE_DARK_THEME] });
    return () => observer.disconnect();
  });

  $effect(() => {
    if (!elCard) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        return;
      }

      observer.disconnect();
      isRevealed = true;
      setTimeout(() => (isDismissable = true), DISMISS_UNLOCK_MILLISECONDS);
    }, { threshold: VISIBILITY_RATIO });

    observer.observe(elCard);
    return () => observer.disconnect();
  });
</script>

<aside
  bind:this={elCard}
  class="promotion"
  class:dark={isDarkTheme}
  class:revealed={isRevealed}
  aria-label="A note from YouTube Auto HD + FPS">
  <header class="attribution">
    <span class="source">YouTube Auto HD + FPS</span>
    <div class="dismiss-anchor">
      <button class="dismiss" aria-label={dismissLabel} disabled={!isDismissable} onclick={onDismiss}>
        <svg aria-hidden="true" focusable="false" height={CLOSE_ICON_SIZE} viewBox="0 0 24 24" width={CLOSE_ICON_SIZE}>
          <path d={mdiClose}/>
        </svg>
      </button>
      {#if !isDismissable}
        <span class="tooltip" aria-hidden="true">{dismissLabel}</span>
      {/if}
    </div>
  </header>

  <p class="headline">Hey there</p>

  <p class="body">
    I think you'll like a free big project that I worked on, <a
      class="call-to-action" href={store.url} onclick={onDismiss}
      target="_blank">Video
      Time Manager</a> that shows you how much time you spend on YouTube
  </p>
</aside>

<style>
  /* WXT's shadow root carries a full document, whose body keeps the 8px UA margin -
     that inset the card from the panels YouTube stacks above and below it */
  :global(body) {
    margin: 0;
  }

  .promotion {
    --promotion-surface: rgb(242 242 242);
    --promotion-text: rgb(15 15 15);
    --promotion-text-secondary: rgb(96 96 96);
    --promotion-link: rgb(6 95 212);
    --promotion-hover-layer: rgb(0 0 0 / 10%);

    direction: ltr;
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    margin-bottom: 8px;
    padding: 16px;
    border-radius: 12px;
    background-color: var(--promotion-surface);
    color: var(--promotion-text);
    font-family: Roboto, Arial, sans-serif;
    opacity: 0%;
    transition: opacity 200ms cubic-bezier(0.05, 0, 0, 1),
    transform 200ms cubic-bezier(0.05, 0, 0, 1);
    transform: translateY(6px);

    &.dark {
      --promotion-surface: rgb(39 39 39);
      --promotion-text: rgb(241 241 241);
      --promotion-text-secondary: rgb(170 170 170);
      --promotion-link: rgb(62 166 255);
      --promotion-hover-layer: rgb(255 255 255 / 10%);
    }

    &.revealed {
      opacity: 100%;
      transform: none;
    }

    & > * + * {
      margin-block-start: 8px;
    }
  }

  .attribution {
    display: flex;
    align-items: center;

    & .source {
      flex: 1;
      color: var(--promotion-text-secondary);
      font-size: 12px;
      line-height: 1.33;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .dismiss-anchor {
    position: relative;
    display: flex;
    flex: none;
    margin-block: -4px;
    margin-inline: 8px -4px;
  }

  /* YouTube's own tp-yt-paper-tooltip is built with shady, document-scoped CSS, so the element
     renders unstyled inside a shadow root - these are its measured native values */
  .tooltip {
    position: absolute;
    top: calc(100% + 8px);
    inset-inline-end: 0;
    z-index: 1;
    padding: 8px;
    border-radius: 4px;
    background-color: rgb(97 97 97);
    color: rgb(255 255 255);
    font-size: 12px;
    line-height: 1.5;
    white-space: nowrap;
    opacity: 0%;
    pointer-events: none;
    transition: opacity 100ms cubic-bezier(0.05, 0, 0, 1) 500ms;
  }

  .dismiss-anchor:hover .tooltip {
    opacity: 100%;
  }

  .dismiss {
    display: grid;
    place-items: center;
    box-sizing: border-box;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    color: var(--promotion-text-secondary);
    cursor: pointer;
    transition: opacity 200ms cubic-bezier(0.05, 0, 0, 1);

    & path {
      fill: currentColor;
    }

    &:hover {
      background-color: var(--promotion-hover-layer);
    }

    &:disabled {
      background: none;
      opacity: 30%;
      cursor: default;
    }
  }

  .headline {
    margin: 0;
    font-weight: 500;
    font-size: 15px;
    line-height: 1.4;
  }

  .body {
    margin: 0;
    color: var(--promotion-text-secondary);
    font-size: 13px;
    line-height: 1.46;

    & strong {
      color: var(--promotion-text);
      font-weight: 500;
    }
  }

  .call-to-action {
    display: inline-block;
    color: var(--promotion-link);
    font-weight: 500;
    font-size: 13px;
    line-height: 1.46;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      text-decoration: underline;
    }
  }

  .reassurance {
    display: block;
    margin-block-start: 4px;
    color: var(--promotion-text-secondary);
    font-size: 12px;
    line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .promotion {
      transition: none;
    }
  }
</style>
