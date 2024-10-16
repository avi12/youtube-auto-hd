import { fpsSupported, qualities } from "./ythd-setup";

export const SUFFIX_EBR = "ebr";
export type VideoQuality = (typeof qualities)[number];
export type EnhancedVideoQuality = `${Exclude<VideoQuality, 720 | 480 | 360 | 240 | 144>}${typeof SUFFIX_EBR}`; // "4320ebr" | "2160ebr" | "1440ebr" | "1080ebr" | ...
export type VideoFPS = (typeof fpsSupported)[number];
export type IsEnhancedBitrate = boolean;
export type Progressive = "p";
export type Spherical = "s";

export type FullYouTubeLabel = `${VideoQuality}${Progressive | Spherical}${VideoFPS}`; // "1080p60" | "720s50" ...`

export type QualityFpsPreferences = Record<VideoFPS, VideoQuality>;

export type EnhancedBitrateFpsPreferences = Record<VideoFPS, VideoQuality | EnhancedVideoQuality>;

export type EnhancedBitratePreferences = Record<VideoFPS, IsEnhancedBitrate>;

export type VideoAutoResize = boolean;
export type VideoSize = 1 | 0;
