<script lang="ts">
  import { Storage } from "@plasmohq/storage";
  import { onMount } from "svelte";
  import Switch from "~popup/components/Switch.svelte";
  import { isResizeVideo, sizeVideo } from "~popup/store";
  import { getI18n } from "~shared-scripts/ythd-utils";

  const i18n: { [key: string]: string } = {
    labelIsResizeVideo: getI18n("cj_i18n_06568", "Auto-resize videos"),
    labelVideoSize: getI18n("cj_i18n_06567", "Keep size at"),
    labelSizeSmall: getI18n("cj_i18n_07097", "Default view"),
    labelSizeLarge: getI18n("cj_i18n_07098", "Cinema view")
  };

  const storageSync = new Storage({ area: "sync" });

  let elContainer: Element;
  let isRTL: boolean;
  onMount(() => {
    isRTL = Boolean(document.querySelector(".rtl"));
  });

  function attachFocusToParent(e: KeyboardEvent): void {
    // https://web.dev/control-focus-with-tabindex/#create-accessible-components-with-roving-tabindex
    switch (e.code) {
      case "ArrowLeft":
        if (isRTL) {
          focusNextItem();
        } else {
          focusPrevItem();
        }
        break;
      case "ArrowRight":
        if (isRTL) {
          focusPrevItem();
        } else {
          focusNextItem();
        }
        break;
    }
  }

  function focusPrevItem(): void {
    const elBox = document.activeElement.previousElementSibling as HTMLButtonElement;
    if (elBox) {
      activate(elBox);
    }
  }

  function focusNextItem(): void {
    const elBox = document.activeElement.nextElementSibling as HTMLButtonElement;
    if (elBox) {
      activate(elBox);
    }
  }

  function activate(elBox: HTMLButtonElement): void {
    const elBoxes = [...elContainer.querySelectorAll(".size__box")] as HTMLButtonElement[];
    elBoxes.forEach(el => {
      el.tabIndex = -1;
    });

    elBox.tabIndex = 0;
    elBox.focus();
  }

  $: {
    storageSync.set("autoResize", $isResizeVideo);
  }

  $: if ($isResizeVideo) {
    chrome.cookies.set({
      url: "https://youtube.com/",
      name: "wide",
      value: $sizeVideo.toString()
    });
  }

  $: {
    storageSync.set("size", $sizeVideo);
  }
</script>

<article class="control-section">
  <Switch bind:checked={$isResizeVideo}>{i18n.labelIsResizeVideo}</Switch>

  {#if $isResizeVideo}
    <section class="size">
      <div class="label">{i18n.labelVideoSize}</div>

      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="inner" on:keydown={attachFocusToParent} bind:this={elContainer}>
        <button
          class="box"
          data-size="small"
          aria-label={i18n.labelSizeSmall}
          class:selected={$sizeVideo === 0}
          on:click={() => ($sizeVideo = 0)}
          tabindex="0">
          <!--suppress HtmlUnknownTag -->
          <div class="rectangle"></div>
        </button>
        <button
          class="box"
          data-size="large"
          aria-label={i18n.labelSizeLarge}
          class:selected={$sizeVideo === 1}
          on:click={() => ($sizeVideo = 1)}
          tabindex="-1">
          <!--suppress HtmlUnknownTag -->
          <div class="rectangle"></div>
        </button>
      </div>
    </section>
  {/if}
</article>

<hr />

<style>
  .size {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1rem;

    & .label {
      flex: 1;
      padding-inline-end: 1rem;
    }

    & .inner {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    & .box {
      display: grid;
      place-items: center;
      width: 50px;
      height: 42px;
      border: 1px solid transparent;
      border-radius: 5px;
      background-color: transparent;
      cursor: pointer;
      transition: 0.2s ease-in-out;

      &:hover {
        border-color: var(--outline-size-box-wrapper);
      }

      & .rectangle {
        border: 1px solid var(--outline-size-box);
        border-radius: 4px;
        transition: border-color 0.2s ease-in-out;
      }

      &.selected {
        & .rectangle {
          border-color: var(--outline-size-box-selected);
        }
      }
    }
  }

  [data-size="small"] {
    & .rectangle {
      width: 21px;
      height: 14px;
    }
  }

  [data-size="large"] {
    & .rectangle {
      width: 34px;
      height: 26px;
    }
  }

  hr {
    margin-top: 1.25rem;
  }
</style>
