import type { IsEnhancedBitrate, VideoAutoResize, VideoQuality, VideoSize } from "@/lib/types";

export const isExtensionEnabled = $state<{ value: boolean | null }>({ value: null });
export const isHideDonationSection = $state<{ value: boolean | null }>({ value: null });
export const isResizeVideo = $state<{ value: VideoAutoResize | null }>({ value: null });
export const sizeVideo = $state<{ value: VideoSize | null }>({ value: null });
export const isExcludeVertical = $state<{ value: boolean | null }>({ value: null });
export const qualitiesStored = $state<{ value: Record<string, VideoQuality> | null }>({ value: null });
export const isEnhancedBitrates = $state<{ value: Record<string, IsEnhancedBitrate> | null }>({
  value: null
});
