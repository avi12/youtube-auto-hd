"use strict";

export const qualities = [4320, 2160, 1440, 1080, 720, 480, 360, 240, 144];
const qualityClosest = qualities.find(quality => quality <= screen.height);

export const initial = {
  qualities: {
    60: qualityClosest,
    50: qualityClosest,
    30: qualityClosest
  },
  autoResize: true,
  size: 1
};
