<script lang="ts">
  import Section from "@/entrypoints/popup/components/Section.svelte";
  import {
    isEnableYouTubeMusic,
    isEnhancedBitrates,
    isExcludeVertical,
    isExtensionEnabled,
    isForceSdr,
    isHideDonationSection,
    isLimitHdrBrightness,
    isResizeVideo,
    isUseGlobalQualityPreferences,
    isUseSuperResolution,
    qualitiesMusicStored,
    qualitiesStored,
    sizeVideo
  } from "@/entrypoints/popup/states.svelte";
  import ControlEnabled from "@/entrypoints/popup/views/ControlEnabled.svelte";
  import ControlHdr from "@/entrypoints/popup/views/ControlHdr.svelte";
  import ControlQuality from "@/entrypoints/popup/views/ControlQuality.svelte";
  import ControlSize from "@/entrypoints/popup/views/ControlSize.svelte";
  import ControlYouTubeMusic from "@/entrypoints/popup/views/ControlYouTubeMusic.svelte";
  import Promotions from "@/entrypoints/popup/views/Promotions.svelte";
  import type { EnhancedBitratePreferences, QualityFpsPreferences, VideoAutoResize, VideoSize } from "@/lib/ythd-types";
  import { getI18n } from "@/lib/ythd-utils";
  import { untrack } from "svelte";

  interface Props {
    qualities: QualityFpsPreferences;
    enhancedBitrates: EnhancedBitratePreferences;
    useSuperResolution: boolean;
    isLimitHdrBrightness: boolean;
    isForceSdr: boolean;
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
    isLimitHdrBrightness: isLimitHdrBrightnessInitial,
    isForceSdr: isForceSdrInitial,
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
    isLimitHdrBrightness.value = isLimitHdrBrightnessInitial;
    isForceSdr.value = isForceSdrInitial;
    isExtensionEnabled.value = extensionEnabled;
    isResizeVideo.value = autoResize;
    sizeVideo.value = size;
    isExcludeVertical.value = excludeVertical;
    isHideDonationSection.value = hideDonationSection;
    isEnableYouTubeMusic.value = enableYouTubeMusic;
    isUseGlobalQualityPreferences.value = useGlobalQualityPreferences;
    qualitiesMusicStored.value = qualitiesMusic;
  });

  const dirValue = getI18n("@@bidi_dir");
  const dir: "ltr" | "rtl" = dirValue === "rtl" ? "rtl" : "ltr";
</script>

<main {dir}>
  <ControlEnabled />

  {#if isExtensionEnabled.value}
    <Section label={getI18n("cj_i18n_08028", "Quality")}>
      <ControlQuality />
    </Section>
    <Section label={getI18n("cj_i18n_08031", "Video brightness")}>
      <ControlHdr />
    </Section>
    <Section label={getI18n("cj_i18n_06859", "Player size")}>
      <ControlSize />
    </Section>
    <Section label={getI18n("cj_i18n_01057", "YouTube Music")}>
      <ControlYouTubeMusic />
    </Section>
  {/if}

  <Promotions />
</main>
