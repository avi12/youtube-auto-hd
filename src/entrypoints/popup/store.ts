import { writable } from "svelte/store";
import type { IsEnhancedBitrate, VideoAutoResize, VideoQuality, VideoSize } from "@/lib/types";

export const isExtensionEnabled = writable<boolean>();
export const isHideDonationSection = writable<boolean>();
export const isResizeVideo = writable<VideoAutoResize>();
export const sizeVideo = writable<VideoSize>();
export const qualitiesStored = writable<Record<string, VideoQuality>>();
export const isEnhancedBitrates = writable<Record<string, IsEnhancedBitrate>>();
