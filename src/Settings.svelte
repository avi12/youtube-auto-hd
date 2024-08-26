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
  @import "./popup/styles/_main.css";
  @import "./popup/styles/_variables.css";
</style>
