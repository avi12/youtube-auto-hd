"use strict";

import type { Preferences } from "~types";

export const qualities = [4320, 2160, 1440, 1080, 720, 480, 360, 240, 144] as const;

export const qualityToLabel = {
  4320: "highres",
  2160: "hd2160",
  1440: "hd1440",
  1080: "hd1080",
  720: "hd720",
  480: "large",
  360: "medium",
  240: "small",
  144: "tiny"
} as const;

export const labelToQuality = {
  highres: 4320,
  hd2160: 2160,
  hd1440: 1440,
  hd1080: 1080,
  hd720: 720,
  large: 480,
  medium: 360,
  small: 240,
  tiny: 144
} as const;

const qualityClosest = qualities.find(quality => quality <= screen.height);
export const fpsSupported = [60, 50, 30] as const;

export const initial: Preferences = {
  isExtensionEnabled: true,
  isHideDonationSection: false,
  isDonated: false,
  qualities: {
    60: qualityClosest,
    50: qualityClosest,
    30: qualityClosest
  },
  isResizeVideo: false,
  size: 1
} as const;
