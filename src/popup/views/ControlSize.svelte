<script lang="ts">
  import { Switch } from "svelte-materialify";
  import { initial } from "../../shared-scripts/ythd-setup";
  import { getI18n } from "../../shared-scripts/ythd-utilities";
  import type { VideoAutoResize, VideoSize } from "../../types";

  export let sizeVideo: VideoSize = initial.size;
  export let isResizeVideo: VideoAutoResize = initial.isResizeVideo;

  const i18n: { [key: string]: string } = {
    labelIsResizeVideo: getI18n("cj_i18n_06568", "Auto-resize videos"),
    labelSubHeaderSize: getI18n("cj_i18n_06859", "Player size"),
    labelVideoSize: getI18n("cj_i18n_06567", "Keep size at")
  };

  function resizeVideo(e): void {
    switch (e.key) {
      case "Enter":
        {
          const sizeNew: `${VideoSize}` = e.target.firstElementChild.dataset.videoSize;
          sizeVideo = Number(sizeNew) as VideoSize;
        }
        break;

      case "ArrowRight":
        {
          sizeVideo = 1;
          elSizeLarge.focus();
        }
        break;

      case "ArrowLeft":
        {
          sizeVideo = 0;
          elSizeSmall.focus();
        }
        break;
    }
  }

  function onTabToSize(e): void {
    if (e.key !== "Tab" || e.shiftKey) {
      return;
    }

    if (sizeVideo) {
      elSizeLarge.focus();
    } else {
      elSizeSmall.focus();
    }
  }

  $: {
    // noinspection TypeScriptUnresolvedFunction
    chrome.storage.sync.set({ size: sizeVideo });
  }

  $: {
    // noinspection TypeScriptUnresolvedFunction
    chrome.storage.sync.set({ autoResize: isResizeVideo });
  }

  let elSizeSmall: HTMLDivElement;
  let elSizeLarge: HTMLDivElement;

  function getCookiePermission(e: Event): void {
    const { checked } = e.target as HTMLInputElement;
    if (!checked) {
      isResizeVideo = false;
      return;
    }

    chrome.permissions.request({ permissions: ["cookies"] }, isGranted => {
      if (isGranted) {
        isResizeVideo = true;
        chrome.cookies.set({
          url: "https://youtube.com/",
          name: "wide",
          value: sizeVideo.toString()
        });
      }
    });
  }
</script>

<div class="subheader">{i18n.labelSubHeaderSize}</div>
<Switch on:change={getCookiePermission} checked={isResizeVideo} color="red" on:keydown={onTabToSize}>
  {i18n.labelIsResizeVideo}
</Switch>

{#if isResizeVideo}
  <div class="size">
    <div class="size__label">{i18n.labelVideoSize}:</div>
    <div
      class="size__box-wrapper"
      class:size__box-wrapper--selected={sizeVideo === 0}
      on:keydown={resizeVideo}
      bind:this={elSizeSmall}
      on:click={() => (sizeVideo = 0)}
    >
      <!--suppress CheckEmptyScriptTag -->
      <div aria-label="Small player size" tabindex="0" class="size__box" data-video-size="0" />
    </div>
    <div
      class="size__box-wrapper"
      class:size__box-wrapper--selected={sizeVideo === 1}
      on:keydown={resizeVideo}
      bind:this={elSizeLarge}
      on:click={() => (sizeVideo = 1)}
    >
      <!--suppress CheckEmptyScriptTag -->
      <div aria-label="Large player size" tabindex="0" class="size__box" data-video-size="1" />
    </div>
  </div>
{/if}

<style>
  .size {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .size__label {
    flex: 1;
    padding-inline-end: 16px;
  }

  .size__box-wrapper {
    display: flex;
    flex: none;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 42px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    cursor: pointer;
    transition: 200ms ease-in-out;
  }

  /*noinspection CssUnusedSymbol*/
  :global(.theme--dark) .size__box {
    outline-color: hsl(0, 0%, 80%);
  }

  .size__box-wrapper:focus-within {
    border-color: blue;
  }

  .size__box-wrapper--selected {
    border: 1px solid red;
    background-color: hsla(0, 73%, 45%, 0.2);
  }

  /*noinspection CssUnusedSymbol*/
  :global(.theme--dark) .size__box-wrapper--selected {
    background-color: hsla(0, 73%, 85%, 0.4);
  }

  .size__box-wrapper:not(.size__box-wrapper--selected):hover {
    background: hsl(0, 0%, 92%);
  }

  /*noinspection CssUnusedSymbol*/
  :global(.theme--dark) .size__box-wrapper:not(.size__box-wrapper--selected):hover {
    background: hsl(0, 0%, 25%);
  }

  [data-video-size="0"] {
    width: 13px;
    height: 8px;
    outline: 2px solid black;
  }

  [data-video-size="1"] {
    width: 22px;
    height: 15px;
    outline: 3px solid black;
  }
</style>
