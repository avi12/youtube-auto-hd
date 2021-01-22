"use strict";

/**
 * @type {number[]}
 */
export const qualities = [4320, 2160, 1440, 1080, 720, 480, 360, 240, 144];
/**
 * @type {number}
 */
const qualityClosest = qualities.find(quality => quality <= screen.height);

// noinspection JSValidateJSDoc
/**
 * @typedef {object} InitialValues
 * @property {{60: number, 50: number, 30: number}} qualities
 * @property {"lower"|"higher"} qualityFallback
 * @property {boolean} autoResize
 * @property {1|0} size
 */
export const initial = {
  qualities: {
    60: qualityClosest,
    50: qualityClosest,
    30: qualityClosest
  },
  qualityFallback: "lower",
  autoResize: true,
  size: 1
};
