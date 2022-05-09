import type { fpsSupported, qualities } from "./shared-scripts/ythd-setup";
import type { qualityToLabel } from "./shared-scripts/ythd-setup";

export type VideoQuality = typeof qualities[number];
export type YouTubeLabel = typeof qualityToLabel[typeof qualities[number]]; // "highres" | "hd2160" | ...
export type VideoFPS = typeof fpsSupported[number];
export type Progressive = "p";
export type Spherical = "s";

export type QualityLabels = `${VideoQuality}${Progressive | Spherical}${VideoFPS}`; // "1080p60" | "720s50" ...

export type FpsOptions = {
  [fps in VideoFPS]: VideoQuality
};

export type VideoAutoResize = boolean
export type VideoSize = 1 | 0;

export interface Preferences {
  qualities: FpsOptions;
  isResizeVideo: VideoAutoResize;
  size: VideoSize;
}
