import { fpsSupported, qualities } from "./ythd-setup";

export const SUFFIX_EBR = "ebr";
export const SUFFIX_SUPER_RESOLUTION = "sr";

export type VideoQuality = (typeof qualities)[number];

// Fix: Add 'extends number' so TS knows T is valid inside `${T}`
type AddSuffix<T extends number, S extends string> = T extends any
  ? `${T}${S}`
  : never;

export type EnhancedVideoQuality = AddSuffix<Exclude<VideoQuality, 720 | 480 | 360 | 240 | 144>, typeof SUFFIX_EBR>;

export type SuperResolutionQuality = AddSuffix<VideoQuality, typeof SUFFIX_SUPER_RESOLUTION>;
export type VideoFPS = (typeof fpsSupported)[number];
export type IsEnhancedBitrate = boolean;
export type Progressive = "p";
export type Spherical = "s";

export type FullYouTubeLabel = `${VideoQuality}${Progressive | Spherical}${VideoFPS}`; // "1080p60" | "720s50" ...`

export type QualityFpsPreferences = Record<VideoFPS, VideoQuality>;

export type EnhancedBitrateFpsPreferences = Record<VideoFPS, VideoQuality | EnhancedVideoQuality>;

export type EnhancedBitratePreferences = Record<VideoFPS, IsEnhancedBitrate>;

export type VideoAutoResize = boolean;
export type VideoSize = 1 | 0 | "1" | "0";
