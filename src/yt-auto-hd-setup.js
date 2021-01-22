"use strict";

/**
 * @type {number[]}
 */
export const qualities = [4320, 2160, 1440, 1080, 720, 480, 360, 240, 144];
/**
 * @type {number}
 */
const qualityClosest = qualities.find(quality => quality <= screen.height);

/**
 * @typedef {object} InitialValues
 * @property {{60: number, 50: number, 30: number}} qualities
 * @property {"worse"|"best"} qualityFallback
 * @property {boolean} autoResize
 * @property {1|0} size
 */

/**
 * @type InitialValues
 */
export const initial = {
  qualities: {
    60: qualityClosest,
    50: qualityClosest,
    30: qualityClosest
  },
  qualityFallback: "worse",
  autoResize: true,
  size: 1
};
