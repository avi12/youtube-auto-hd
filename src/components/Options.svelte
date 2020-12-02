<script>
  // noinspection ES6UnusedImports
  import { slide } from "svelte/transition";
  import Promotions from "./Promotions.svelte";

  import { getI18n } from "../yt-auto-hd-utilities";

  import "./styles/toggle-switch.css";
  import "./styles/popup.css";

  export let qualitiesStored;
  let qualitiesSelected = Object.values(qualitiesStored).reverse();
  export let sizeVideo;
  export let isResizeVideo;
  export let isDisplayRateOffer;
  export let isDisplayTranslationOffer;
  export let isDisplaySupportOffer;

  const statesPromotion = {
    isDisplayRateOffer,
    isDisplayTranslationOffer,
    isDisplaySupportOffer
  };

  // prettier-ignore
  const i18n = {
    labelQualityStart: getI18n("cj_i18n_02147", "View quality"),
    labelQualityEnd: getI18n("cj_i18n_02148", "FPS videos"),
    fpsAndBelow: getI18n("cj_i18n_02149", "FPS and below"),
    fpsWarning: getI18n("cj_i18n_02152", "Videos will play at 30 FPS for this quality."),
    labelIsResizeVideo: getI18n("cj_i18n_06568", "Auto-resize videos"),
    labelVideoSize: getI18n("cj_i18n_06567", "Keep size at"),
    dir: getI18n("@@bidi_dir")
  };

  const isLtr = i18n.dir === "ltr";

  const fpsList = [60, 50, 30];

  const qualitiesAvailable = [
    {
      resolution: "7680x4320 - 8K",
      labelQuality: "4320p"
    },
    {
      resolution: "3840x2160 - 4K",
      labelQuality: "2160p"
    },
    {
      resolution: "2560x1440 - 2K",
      labelQuality: "1440p"
    },
    {
      resolution: "1920x1080 - Full HD",
      labelQuality: "1080p"
    },
    {
      resolution: "1280x720",
      labelQuality: "720p"
    },
    {
      resolution: "854x480",
      labelQuality: "480p"
    },
    {
      resolution: "640x360",
      labelQuality: "360p"
    },
    {
      resolution: "426x240",
      labelQuality: "240p"
    },
    {
      resolution: "256x144",
      labelQuality: "144p"
    }
  ];

  function fpsToRange(i) {
    const fpsRangeStart = fpsList[i + 1] + 1;
    const fps = fpsList[i];
    return `${fpsRangeStart}-${fps}`;
  }

  $: {
    chrome.storage.local.set({ qualities: qualitiesStored });
  }

  function isLastIteration(i) {
    return i === fpsList.length - 1;
  }

  function toggleAutoResize(e) {
    if (e.key === "Tab") {
      const elSizeCurrent = document.querySelector(`[id="size-${sizeVideo}"]`);
      e.preventDefault();
      elSizeCurrent.focus();
      return;
    }
    if (e.key !== "Enter" && e.key !== " ") {
      return;
    }

    isResizeVideo = !isResizeVideo;
  }

  $: {
    chrome.storage.sync.set({ autoResize: isResizeVideo });
  }

  function resizeVideo(e) {
    switch (e.key) {
      case "Enter":
        {
          const sizeNew = e.target.firstElementChild.id.replace("size-", "");
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

      case "Tab": {
        if (e.shiftKey) {
          e.preventDefault();
          elSizeToggle.focus();
        }
      }
    }
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
  let elSizeToggle;
</script>

<form class:i18n--rtl={i18n.dir === 'rtl'} id="app">
  <div class="header margin-bottom">YouTube Auto HD</div>

  <div>{i18n.labelQualityStart}</div>
  {#each fpsList as fps, iFps}
    <div class="margin-bottom">
      <div class="label-numeric">
        <label for="select-{iFps}">
          <!-- prettier-ignore -->
          {#if !isLastIteration(iFps)}
            {fpsToRange(iFps)}
            {i18n.labelQualityEnd}
          {:else}
            {fps} {i18n.fpsAndBelow}
          {/if}
        </label>
      </div>

      <select
        id="select-{iFps}"
        class="select-quality"
        bind:value={qualitiesStored[fps]}>
        {#each qualitiesAvailable as { resolution, labelQuality }}
          <!-- prettier-ignore -->
          <option value={+labelQuality.replace('p', '')}>
            {labelQuality}
            ({@html resolution.replace('x', '&times;')})
          </option>
        {/each}
      </select>
      {#if iFps !== fpsList.length - 1 && fps > 30 && qualitiesStored[fps] < 720}
        <div transition:slide={{ duration: 250 }} class="margin-bottom">
          {i18n.fpsWarning}
        </div>
      {/if}
    </div>
  {/each}

  <div class="margin-vertical margin-top--extended">
    <label
      bind:this={elSizeToggle}
      class="switch margin--end"
      on:keydown={toggleAutoResize}
      tabindex="0">
      <input
        bind:checked={isResizeVideo}
        class="switch__checkbox"
        type="checkbox" />
      <!--suppress CheckEmptyScriptTag -->
      <span class="switch__slider switch__slider--round" />
    </label>
    {i18n.labelIsResizeVideo}
  </div>

  {#if isResizeVideo}
    <div
      transition:slide={{ duration: 250 }}
      class="margin--top size-container">
      <div class="margin--end">{i18n.labelVideoSize}:</div>
      <div
        class="size-box"
        class:size-box--selected={sizeVideo === 0}
        on:keydown={resizeVideo}>
        <!--suppress CheckEmptyScriptTag -->
        <div
          aria-label="Small player size"
          tabindex="0"
          class="size-box__box"
          id="size-0"
          bind:this={elSizeSmall}
          on:click={() => (sizeVideo = 0)} />
      </div>
      <div
        class="size-box"
        class:size-box--selected={sizeVideo === 1}
        on:keydown={resizeVideo}>
        <!--suppress CheckEmptyScriptTag -->
        <div
          aria-label="Large player size"
          tabindex="0"
          class="size-box__box"
          bind:this={elSizeLarge}
          id="size-1"
          on:click={() => (sizeVideo = 1)} />
      </div>
    </div>
  {/if}
</form>

<Promotions {statesPromotion} />
