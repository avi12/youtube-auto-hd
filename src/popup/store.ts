import { writable } from "svelte/store";

import type { EnhancedBitratePreferences, QualityFpsPreferences, VideoAutoResize, VideoSize } from "~types";

export const isExtensionEnabled = writable<boolean>();
export const isHideDonationSection = writable<boolean>();
export const isResizeVideo = writable<VideoAutoResize>();
export const sizeVideo = writable<VideoSize>();
export const qualitiesStored = writable<QualityFpsPreferences>();
export const isEnhancedBitrates = writable<EnhancedBitratePreferences>();
