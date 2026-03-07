import { fpsSupported, qualities } from "./ythd-defaults";

export const SUFFIX_EBR = "ebr";
export const SUFFIX_SUPER_RESOLUTION = "sr";

export type VideoQuality = (typeof qualities)[number];

type AddSuffix<T extends number, S extends string> = `${T}${S}`;

export type EnhancedVideoQuality = AddSuffix<Exclude<VideoQuality, 720 | 480 | 360 | 240 | 144>, typeof SUFFIX_EBR>;

export type SuperResolutionQuality = AddSuffix<VideoQuality, typeof SUFFIX_SUPER_RESOLUTION>;
export type VideoFPS = (typeof fpsSupported)[number];
export type IsEnhancedBitrate = boolean;
export type Progressive = "p";
export type Spherical = "s";

type QualityLabelRaw = `${VideoQuality}${Progressive | Spherical}`;
export type QualityLabel = QualityLabelRaw | `${QualityLabelRaw}${Exclude<VideoFPS, 30>}`;

export type QualityFpsPreferences = Record<VideoFPS, VideoQuality>;

export type EnhancedBitrateFpsPreferences = Record<VideoFPS, VideoQuality | EnhancedVideoQuality>;

export type EnhancedBitratePreferences = Record<VideoFPS, IsEnhancedBitrate>;

export type VideoAutoResize = boolean;
export type VideoSize = 1 | 0;

export type YTMusicQuality =
  | "highres" | "hd2160" | "hd1440" | "hd1080" | "hd720"
  | "large" | "medium" | "small" | "tiny";
