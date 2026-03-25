<script lang="ts">
  import { browser, storage } from "#imports";
  import Switch from "@/entrypoints/popup/components/Switch.svelte";
  import { isExcludeVertical, isResizeVideo, sizeVideo } from "@/entrypoints/popup/states.svelte";
  import { getI18n } from "@/lib/ythd-utils";
  import type { VideoSize } from "@/lib/ythd-types";

  const i18n = {
    labelIsResizeVideo: getI18n("cj_i18n_06568", "Auto-resize videos"),
    labelVideoSize: getI18n("cj_i18n_06567", "Keep size at"),
    labelOExcludeVertical: getI18n("cj_i18n_07754", "Except for vertical videos"),
    labelSizeSmall: getI18n("cj_i18n_07097", "Default view"),
    labelSizeLarge: getI18n("cj_i18n_07098", "Cinema view")
  };

  const groupId = crypto.randomUUID();

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
    <fieldset class="size">
      <legend>{i18n.labelVideoSize}</legend>
      <div class="inner">
        {#each [{ value: 0, label: i18n.labelSizeSmall }, { value: 1, label: i18n.labelSizeLarge }] as option (option.value)}
          <label class="box" data-size={option.value === 0 ? "small" : "large"} class:selected={sizeVideo.value === option.value}>
            <input
              type="radio"
              name="video-size-{groupId}"
              bind:group={sizeVideo.value}
              value={option.value as VideoSize} />
            <span class="visually-hidden">{option.label}</span>
            <div class="rectangle"></div>
          </label>
        {/each}
      </div>
    </fieldset>

    <Switch bind:checked={isExcludeVertical.value}>{i18n.labelOExcludeVertical}</Switch>
  {/if}
</article>

<hr class="section-divider" />

<style>
  .size {
    display: flex;
    align-items: center;
    min-inline-size: 0;
    margin-top: 1rem;
    padding: 0;
    border: none;

    & > legend {
      flex: 1;
      padding: 0;
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
      cursor: pointer;
      transition: border-color 200ms ease-in-out;

      &:hover,
      &:focus-within {
        border-color: var(--outline-size-box-wrapper);
      }

      & input {
        position: absolute;
        overflow: hidden;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        border: 0;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      & .visually-hidden {
        position: absolute;
        overflow: hidden;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        border: 0;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      & .rectangle {
        border: 1px solid var(--outline-size-box);
        border-radius: 4px;
        transition: border-color 200ms ease-in-out;
      }

      &[data-size="small"] .rectangle {
        width: 21px;
        height: 14px;
      }

      &[data-size="large"] .rectangle {
        width: 34px;
        height: 26px;
      }

      &.selected .rectangle {
        border-color: var(--outline-size-box-selected);
      }
    }
  }

  .section-divider {
    margin-top: 1.25rem;
  }
</style>
