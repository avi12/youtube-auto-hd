import "./popup.css";
import Popup from "./Popup.svelte";
import { initial } from "@/lib/ythd-defaults";
import type { EnhancedBitratePreferences, QualityFpsPreferences, VideoAutoResize, VideoSize } from "@/lib/ythd-types";
import { storage } from "#imports";
import { mount } from "svelte";

const [
  qualitiesRaw,
  enhancedBitratesRaw,
  useSuperResolution,
  extensionEnabled,
  autoResize,
  size,
  excludeVertical,
  hideDonationSection,
  enableYouTubeMusic,
  useGlobalQualityPreferences,
  qualitiesMusicRaw
] = await Promise.all([
  storage.getItem<QualityFpsPreferences>("local:qualities", { fallback: initial.qualities }),
  storage.getItem<EnhancedBitratePreferences>("local:isEnhancedBitrates", { fallback: initial.isEnhancedBitrates }),
  storage.getItem<boolean>("local:isUseSuperResolution", { fallback: initial.isUseSuperResolution }),
  storage.getItem<boolean>("local:isExtensionEnabled", { fallback: initial.isExtensionEnabled }),
  storage.getItem<VideoAutoResize>("sync:autoResize", { fallback: initial.isResizeVideo }),
  storage.getItem<VideoSize>("sync:size", { fallback: initial.size }),
  storage.getItem<boolean>("sync:isExcludeVertical", { fallback: initial.isExcludeVertical }),
  storage.getItem<boolean>("sync:isHideDonationSection", { fallback: initial.isHideDonationSection }),
  storage.getItem<boolean>("local:isEnableYouTubeMusic", { fallback: initial.isEnableYouTubeMusic }),
  storage.getItem<boolean>("local:isUseGlobalQualityPreferences", { fallback: initial.isUseGlobalQualityPreferences }),
  storage.getItem<QualityFpsPreferences>("local:qualitiesMusic", { fallback: initial.qualities })
]);

// Merge with initial to ensure all FPS keys exist (handles storage from older versions)
const qualities = { ...initial.qualities, ...qualitiesRaw };
const enhancedBitrates = { ...initial.isEnhancedBitrates, ...enhancedBitratesRaw };
const qualitiesMusic = { ...initial.qualities, ...qualitiesMusicRaw };

export default mount(Popup, {
  target: document.getElementById("app") ?? document.body,
  props: {
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
  }
});
