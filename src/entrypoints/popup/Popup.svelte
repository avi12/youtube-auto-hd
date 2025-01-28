<script lang="ts">
  import { storage } from "wxt/storage";
  import {
    isEnhancedBitrates,
    isExcludeVertical,
    isExtensionEnabled,
    isHideDonationSection,
    isResizeVideo,
    qualitiesStored,
    sizeVideo
  } from "@/entrypoints/popup/store";
  import ControlEnabled from "@/entrypoints/popup/views/ControlEnabled.svelte";
  import ControlQuality from "@/entrypoints/popup/views/ControlQuality.svelte";
  import ControlSize from "@/entrypoints/popup/views/ControlSize.svelte";
  import Promotions from "@/entrypoints/popup/views/Promotions.svelte";
  import type { EnhancedBitratePreferences, QualityFpsPreferences, VideoAutoResize, VideoSize } from "@/lib/types";
  import { initial } from "@/lib/ythd-setup";
  import { getI18n } from "@/lib/ythd-utils";

  Promise.all([
    storage.getItem<QualityFpsPreferences>("local:qualities", { fallback: initial.qualities }),
    storage.getItem<EnhancedBitratePreferences>("local:isEnhancedBitrates", { fallback: initial.isEnhancedBitrates }),
    storage.getItem<typeof initial.isExtensionEnabled>("local:isExtensionEnabled", {
      fallback: initial.isExtensionEnabled
    }),
    storage.getItem<VideoAutoResize>("sync:autoResize", { fallback: initial.isResizeVideo }),
    storage.getItem<VideoSize>("sync:size", { fallback: initial.size }),
    storage.getItem<boolean>("sync:isExcludeVertical", { fallback: initial.isExcludeVertical }),
    storage.getItem<boolean>("sync:isHideDonationSection", { fallback: initial.isHideDonationSection })
  ]).then(
    ([qualities, pIsEnhancedBitrates, isExtEnabled, autoResize, size, pisExcludeVertical, pIsHideDonationSection]) => {
      $qualitiesStored = qualities;
      $isEnhancedBitrates = pIsEnhancedBitrates;
      $isExtensionEnabled = isExtEnabled;
      $isResizeVideo = autoResize;
      $sizeVideo = size;
      $isExcludeVertical = pisExcludeVertical;
      $isHideDonationSection = pIsHideDonationSection;
    }
  );
</script>

<main class:rtl={getI18n("@@bidi_dir") === "rtl"}>
  {#if $isExtensionEnabled !== undefined}
    <ControlEnabled />
  {/if}

  {#if $isExtensionEnabled}
    {#if $qualitiesStored !== undefined && $isEnhancedBitrates !== undefined}
      <ControlQuality />
    {/if}

    <ControlSize />
  {/if}

  <Promotions />
</main>
