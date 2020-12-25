<script>
  import { getI18n } from "../yt-auto-hd-utilities";
  import { Switch } from "svelte-materialify";
  import { initial } from "../yt-auto-hd-setup";

  export let sizeVideo = initial.size;
  export let isResizeVideo = initial.autoResize;

  const i18n = {
    labelIsResizeVideo: getI18n("cj_i18n_06568", "Auto-resize videos"),
    labelSubHeaderSize: getI18n("cj_i18n_06859", "Player size"),
    labelVideoSize: getI18n("cj_i18n_06567", "Keep size at")
  };

  function resizeVideo(e) {
    switch (e.key) {
      case "Enter":
        {
          const sizeNew = e.target.firstElementChild.dataset.videoSize;
          sizeVideo = +sizeNew;
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

  function onTabToSize(e) {
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
    chrome.storage.sync.set({ autoResize: isResizeVideo });
  }

  $: {
    chrome.storage.sync.set({ size: sizeVideo });

    chrome.cookies.set({
      url: "https://www.youtube.com/",
      name: "wide",
      value: sizeVideo.toString()
    });
  }

  let elSizeSmall;
  let elSizeLarge;
</script>

<div class="subheader">{i18n.labelSubHeaderSize}</div>
<Switch bind:checked={isResizeVideo} color="red" on:keydown={onTabToSize}>
  {i18n.labelIsResizeVideo}
</Switch>

{#if isResizeVideo}
  <div class="size">
    <div>{i18n.labelVideoSize}:</div>
    <div
      class="size__box-wrapper"
      class:size__box-wrapper--selected={sizeVideo === 0}
      on:keydown={resizeVideo}>
      <!--suppress CheckEmptyScriptTag -->
      <div
        aria-label="Small player size"
        tabindex="0"
        class="size__box"
        data-video-size="0"
        bind:this={elSizeSmall}
        on:click={() => (sizeVideo = 0)} />
    </div>
    <div
      class="size__box-wrapper"
      class:size__box-wrapper--selected={sizeVideo === 1}
      on:keydown={resizeVideo}>
      <!--suppress CheckEmptyScriptTag -->
      <div
        aria-label="Large player size"
        tabindex="0"
        class="size__box"
        bind:this={elSizeLarge}
        data-video-size="1"
        on:click={() => (sizeVideo = 1)} />
    </div>
  </div>
{/if}

<style>
  .size {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .size > *:nth-of-type(2) {
    margin-inline-start: 10px;
  }

  .size__box-wrapper {
    border-radius: 5px;
    width: 50px;
    height: 42px;
    transition: 0.2s ease-in-out;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid transparent;
  }

  .size__box-wrapper:focus-within {
    border-color: blue;
  }

  .size__box-wrapper--selected {
    background-color: rgba(200, 31, 31, 0.2);
    border: 1px solid red;
  }

  .size__box {
    cursor: pointer;
  }

  [data-video-size="0"] {
    outline: 2px solid black;
    width: 13px;
    height: 8px;
  }

  [data-video-size="1"] {
    outline: 3px solid black;
    width: 22px;
    height: 15px;
  }
</style>
