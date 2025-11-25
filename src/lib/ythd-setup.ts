export const qualities = [4320, 2160, 1440, 1080, 720, 480, 360, 240, 144] as const;

const qualityClosest = qualities.find(quality => quality <= screen.height)!;
export const fpsSupported = [60, 50, 30] as const;

const now = new Date();
const isPiDay = now.getMonth() === 2 && now.getDate() === 14;

export const initial = {
  isExtensionEnabled: true,
  isHideDonationSection: false,
  isHidePromotionSection: false,
  isHideFunMessageSection: !(import.meta.env.DEV || isPiDay),
  qualities: {
    60: qualityClosest,
    50: qualityClosest,
    30: qualityClosest
  },
  isEnhancedBitrates: {
    // Defaulting to "false" because it's unknown whether the user has premium or not
    60: false,
    50: false,
    30: false
  },
  isUseSuperResolution: true,
  isResizeVideo: false,
  size: 1,
  isExcludeVertical: false
} as const;
