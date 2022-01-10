"use strict";

import type { Preferences } from "../types";

export const qualities = [4320, 2160, 1440, 1080, 720, 480, 360, 240, 144] as const;
const qualityClosest = qualities.find(quality => quality <= screen.height);
export const fpsSupported = [60, 50, 30] as const;

export const initial: Preferences = {
  qualities: {
    60: qualityClosest,
    50: qualityClosest,
    30: qualityClosest
  },
  isResizeVideo: false,
  size: 1
} as const;
