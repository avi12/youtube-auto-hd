<script lang="ts">
  import { storage, browser } from "#imports";
  import Switch from "@/entrypoints/popup/components/Switch.svelte";
  import { isExcludeVertical, isResizeVideo, sizeVideo } from "@/entrypoints/popup/states.svelte";
  import { getI18n } from "@/lib/ythd-utils";

  const i18n: Record<string, string> = {
    labelIsResizeVideo: getI18n("cj_i18n_06568", "Auto-resize videos"),
    labelVideoSize: getI18n("cj_i18n_06567", "Keep size at"),
    labelOExcludeVertical: getI18n("cj_i18n_07754", "Except for vertical videos"),
    labelSizeSmall: getI18n("cj_i18n_07097", "Default view"),
    labelSizeLarge: getI18n("cj_i18n_07098", "Cinema view")
  };

  let elContainer = $state<Element>();
  const isRTL = Boolean(document.querySelector(".rtl"));

  function focusPrevItem() {
    const elBox = document.activeElement?.previousElementSibling as HTMLButtonElement;
    if (elBox) {
      activate(elBox);
    }
  }

  function focusNextItem() {
    const elBox = document.activeElement?.nextElementSibling as HTMLButtonElement;
    if (elBox) {
      activate(elBox);
    }
  }

  function activate(elBox: HTMLElement) {
    const elBoxes = [...elContainer!.querySelectorAll<HTMLButtonElement>(".size__box")];
    elBoxes.forEach(el => {
      el.tabIndex = -1;
    });

    elBox.tabIndex = 0;
    elBox.focus();
  }

  $effect(() => {
    storage.setItem("sync:autoResize", isResizeVideo.value);
  });

  $effect(() => {
    if (!isResizeVideo.value || !isExcludeVertical.value || sizeVideo.value === null) {
      return;
    }
    browser.cookies.set({
      url: "https://youtube.com/",
      name: "wide",
      value: sizeVideo.value.toString()
    });
  });

  $effect(() => {
    storage.setItem("sync:size", sizeVideo.value);
  });

  $effect(() => {
    storage.setItem("sync:isExcludeVertical", isExcludeVertical.value);
  });
</script>

<article class="control-section">
  <Switch bind:checked={isResizeVideo.value}>{i18n.labelIsResizeVideo}</Switch>

  {#if isResizeVideo.value}
    <section class="size">
      <div class="label">{i18n.labelVideoSize}</div>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="inner"
        onkeydown={e => {
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
        }}
        bind:this={elContainer}>
        <button
          class="box"
          data-size="small"
          aria-label={i18n.labelSizeSmall}
          class:selected={Number(sizeVideo.value) === 0}
          onclick={() => (sizeVideo.value = 0)}
          tabindex="0">
          <!--suppress HtmlUnknownTag -->
          <div class="rectangle"></div>
        </button>
        <button
          class="box"
          data-size="large"
          aria-label={i18n.labelSizeLarge}
          class:selected={Number(sizeVideo.value) !== 0}
          onclick={() => (sizeVideo.value = 1)}
          tabindex="-1">
          <!--suppress HtmlUnknownTag -->
          <div class="rectangle"></div>
        </button>
      </div>
    </section>

    <Switch bind:checked={isExcludeVertical.value}>{i18n.labelOExcludeVertical}</Switch>
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
