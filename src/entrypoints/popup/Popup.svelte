<script lang="ts">
  import {
    isEnableYouTubeMusic,
    isEnhancedBitrates,
    isExcludeVertical,
    isExtensionEnabled,
    isHideDonationSection,
    isResizeVideo,
    isUseGlobalQualityPreferences,
    isUseSuperResolution,
    qualitiesMusicStored,
    qualitiesStored,
    sizeVideo
  } from "@/entrypoints/popup/states.svelte";
  import ControlEnabled from "@/entrypoints/popup/views/ControlEnabled.svelte";
  import ControlQuality from "@/entrypoints/popup/views/ControlQuality.svelte";
  import ControlSize from "@/entrypoints/popup/views/ControlSize.svelte";
  import ControlYouTubeMusic from "@/entrypoints/popup/views/ControlYouTubeMusic.svelte";
  import Promotions from "@/entrypoints/popup/views/Promotions.svelte";
  import type { EnhancedBitratePreferences, QualityFpsPreferences, VideoAutoResize, VideoSize } from "@/lib/types";
  import { untrack } from "svelte";
  import { getI18n } from "@/lib/ythd-utils";

  interface Props {
    qualities: QualityFpsPreferences;
    enhancedBitrates: EnhancedBitratePreferences;
    useSuperResolution: boolean;
    extensionEnabled: boolean;
    autoResize: VideoAutoResize;
    size: VideoSize;
    excludeVertical: boolean;
    hideDonationSection: boolean;
    enableYouTubeMusic: boolean;
    useGlobalQualityPreferences: boolean;
    qualitiesMusic: QualityFpsPreferences;
  }

  const {
    qualities,
    enhancedBitrates,
    useSuperResolution,
    extensionEnabled,
    autoResize,
    size,
    excludeVertical,
    hideDonationSection,
    enableYouTubeMusic,
    useGlobalQualityPreferences,
    qualitiesMusic
  }: Props = $props();

  untrack(() => {
    qualitiesStored.value = qualities;
    isEnhancedBitrates.value = enhancedBitrates;
    isUseSuperResolution.value = useSuperResolution;
    isExtensionEnabled.value = extensionEnabled;
    isResizeVideo.value = autoResize;
    sizeVideo.value = size;
    isExcludeVertical.value = excludeVertical;
    isHideDonationSection.value = hideDonationSection;
    isEnableYouTubeMusic.value = enableYouTubeMusic;
    isUseGlobalQualityPreferences.value = useGlobalQualityPreferences;
    qualitiesMusicStored.value = qualitiesMusic;
  });
</script>

<main class:rtl={getI18n("@@bidi_dir") === "rtl"}>
  <ControlEnabled />

  {#if isExtensionEnabled.value}
    <ControlQuality />
    <ControlSize />
    <ControlYouTubeMusic />
  {/if}

  <Promotions />
</main>
