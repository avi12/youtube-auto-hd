"use strict";

const qualities = [4320, 2160, 1440, 1080, 720];
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
