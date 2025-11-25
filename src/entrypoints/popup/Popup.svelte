<script lang="ts">
  import { storage } from "#imports";
  import {
    isEnhancedBitrates,
    isExcludeVertical,
    isExtensionEnabled,
    isHideDonationSection,
    isResizeVideo,
    isUseSuperResolution,
    qualitiesStored,
    sizeVideo
  } from "@/entrypoints/popup/states.svelte";
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
    storage.getItem<typeof initial.isUseSuperResolution>("local:isUseSuperResolution", {
      fallback: initial.isUseSuperResolution
    }),
    storage.getItem<typeof initial.isExtensionEnabled>("local:isExtensionEnabled", {
      fallback: initial.isExtensionEnabled
    }),
    storage.getItem<VideoAutoResize>("sync:autoResize", { fallback: initial.isResizeVideo }),
    storage.getItem<VideoSize>("sync:size", { fallback: initial.size }),
    storage.getItem<boolean>("sync:isExcludeVertical", { fallback: initial.isExcludeVertical }),
    storage.getItem<boolean>("sync:isHideDonationSection", { fallback: initial.isHideDonationSection })
  ]).then(
    ([
      qualities,
      pIsEnhancedBitrates,
      pIsUseSuperResolution,
      isExtEnabled,
      autoResize,
      size,
      pisExcludeVertical,
      pIsHideDonationSection
    ]) => {
      qualitiesStored.value = qualities;
      isEnhancedBitrates.value = pIsEnhancedBitrates;
      isUseSuperResolution.value = pIsUseSuperResolution;
      isExtensionEnabled.value = isExtEnabled;
      isResizeVideo.value = autoResize;
      sizeVideo.value = size;
      isExcludeVertical.value = pisExcludeVertical;
      isHideDonationSection.value = pIsHideDonationSection;
    }
  );
</script>

<main class:rtl={getI18n("@@bidi_dir") === "rtl"}>
  {#if isExtensionEnabled.value !== null}
    <ControlEnabled />
  {/if}

  {#if isExtensionEnabled.value}
    {#if qualitiesStored.value !== null && isEnhancedBitrates.value !== null}
      <ControlQuality />
    {/if}

    <ControlSize />
  {/if}

  <Promotions />
</main>
