<script lang="ts">
  import { Storage } from "@plasmohq/storage";

  import {
    isEnhancedBitrates,
    isExtensionEnabled,
    isHideDonationSection,
    isResizeVideo,
    qualitiesStored,
    sizeVideo
  } from "~popup/store";
  import ControlEnabled from "~popup/views/ControlEnabled.svelte";
  import ControlQuality from "~popup/views/ControlQuality.svelte";
  import ControlSize from "~popup/views/ControlSize.svelte";
  import Header from "~popup/views/Header.svelte";
  import Promotions from "~popup/views/Promotions.svelte";
  import { initial } from "~shared-scripts/ythd-setup";
  import { getI18n, IS_DESKTOP } from "~shared-scripts/ythd-utils";
  import type { EnhancedBitratePreferences, QualityFpsPreferences, VideoAutoResize, VideoSize } from "~types";

  const storageLocal = new Storage({ area: "local" });
  const storageSync = new Storage({ area: "sync" });

  Promise.all([
    storageLocal.get<QualityFpsPreferences>("qualities"),
    storageLocal.get<EnhancedBitratePreferences>("isEnhancedBitrates"),
    storageLocal.get<boolean>("isExtensionEnabled"),
    storageSync.get<VideoSize>("size"),
    storageSync.get<VideoAutoResize>("autoResize"),
    storageSync.get<boolean>("isHideDonationSection")
  ]).then(
    ([
      qualities = initial.qualities,
      pIsEnhancedBitrates = initial.isEnhancedBitrates,
      isExtEnabled = initial.isExtensionEnabled,
      size = initial.size,
      autoResize = initial.isResizeVideo,
      pIsHideDonationSection = initial.isHideDonationSection
    ]) => {
      $qualitiesStored = qualities;
      $isEnhancedBitrates = pIsEnhancedBitrates;
      $isExtensionEnabled = isExtEnabled;
      $sizeVideo = size;
      $isResizeVideo = autoResize;
      $isHideDonationSection = pIsHideDonationSection;
    }
  );
</script>

<svelte:head><title>YouTube Auto HD + FPS</title></svelte:head>

<main class:rtl={getI18n("@@bidi_dir") === "rtl"}>
  {#if !IS_DESKTOP}
    <Header />
  {/if}

  {#if $isExtensionEnabled !== undefined}
    <ControlEnabled />
  {/if}

  {#if $isExtensionEnabled}
    {#if $qualitiesStored !== undefined && $isEnhancedBitrates !== undefined}
      <ControlQuality />
    {/if}

    {#if IS_DESKTOP}
      <ControlSize />
    {/if}
  {/if}

  <Promotions />
</main>

<style global>
  :root {
    --bg-color: hsl(0, 0%, 18%);
    --text-color-primary: hsl(0, 0%, 0%);
    --text-color-secondary: hsl(0, 0%, 53%);
    --text-color-warning: hsl(0, 0%, 0%);
    --bg-color-warning: hsl(0, 0%, 90%);
    --text-color-promotion: hsl(210, 60%, 53%);

    --switch-on-thumb-color: hsl(0, 93%, 61%);
    --switch-on-bg-color: hsl(0, 100%, 90%);
    --switch-off-thumb-color: hsl(0, 93%, 61%);
    --switch-off-bg-color: hsl(0, 0%, 92%);

    --slider-track-cover-color: hsl(0, 93%, 61%);
    --slider-track-uncover-color: hsl(0, 0%, 90%);

    --outline-size-box-wrapper: hsl(0, 0%, 83%);
    --outline-size-box: hsl(0, 0%, 78%);
    --outline-size-box-selected: hsl(0, 93%, 61%);

    --hr-color: hsl(0, 0%, 90%);
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg-color: hsl(0, 0%, 7%);
      --text-color-primary: hsl(0, 0%, 100%);
      --text-color-secondary: hsl(0, 0%, 55%);
      --text-color-warning: hsl(0, 0%, 100%);
      --bg-color-warning: hsl(0, 0%, 25%);
      --text-color-promotion: hsl(210, 50%, 53%);

      --switch-on-thumb-color: hsl(0, 100%, 50%);
      --switch-on-bg-color: hsl(0, 15%, 31%);
      --switch-off-thumb-color: hsl(0, 0%, 85%);
      --switch-off-bg-color: hsl(0, 0%, 27%);

      --slider-track-cover-color: hsl(0, 0%, 80%);
      --slider-track-uncover-color: hsl(0, 0%, 27%);

      --outline-size-box-wrapper: hsl(0, 0%, 50%);
      --outline-size-box: hsl(0, 0%, 35%);
      --outline-size-box-selected: hsl(0, 0%, 81%);

      --hr-color: hsl(0, 0%, 27%);
    }
  }

  /* Chromium browsers */
  ::-webkit-scrollbar {
    width: 0;
  }

  /* Firefox */
  html {
    scrollbar-width: none;
  }

  hr {
    border: none;
    border-top: 1px solid var(--hr-color);
  }

  /* Global */
  body {
    color: var(--text-color-primary);
    background-color: var(--bg-color);
    width: 280px;
    font-size: max(0.85rem, 13px);
    font-family: Roboto, Arial, sans-serif;
    padding: 12px 18px 16px;
    user-select: none;
    margin: 0 auto;
  }

  .rtl {
    direction: rtl;
  }

  .control-section {
    margin-top: 20px;
  }

  .options-page {
    margin-bottom: 20px; /* For Firefox */

    & .control-section:first-child {
      margin-top: 0;
    }
  }
</style>
