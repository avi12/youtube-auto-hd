import { qualities } from "./ythd-defaults";
import type { QualityFpsPreferences, VideoQuality, YTMusicQuality } from "./ythd-types";
import { extractFpsFromLabel, getFpsFromRange, getPlayerDiv, getVisibleElement, SELECTORS } from "./ythd-utils";

type QualityData = {
  qualityLabel: string;
  quality: YTMusicQuality;
  isPlayable: boolean;
};

type YTPlayerElement = HTMLDivElement & {
  setPlaybackQualityRange?(quality1: YTMusicQuality, quality2: YTMusicQuality): void;
  getAvailableQualityData?(): QualityData[];
};

export const QUALITY_MAP: Record<VideoQuality, YTMusicQuality> = {
  4320: "highres",
  2160: "hd2160",
  1440: "hd1440",
  1080: "hd1080",
  720: "hd720",
  480: "large",
  360: "medium",
  240: "small",
  144: "tiny"
};

export const QUALITY_NUMBER = Object.fromEntries<VideoQuality>(
  Object.entries(QUALITY_MAP).map(([number, label]) => {
    const videoQuality = qualities.find(quality => quality === Number(number));
    if (videoQuality === undefined) {
      throw new Error(`[YTHD] Invalid quality value in QUALITY_MAP: ${number}`);
    }
    return [label, videoQuality];
  })
);

export function changeQualityViaPlayerAPI(qualityPreferences: QualityFpsPreferences) {
  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!elVideo) {
    return;
  }

  const elPlayer = getPlayerDiv<YTPlayerElement>(elVideo);
  const qualityData = elPlayer?.getAvailableQualityData?.();
  if (!qualityData || !elPlayer?.setPlaybackQualityRange) {
    return;
  }

  const fpsLabel = qualityData.find(data => data.qualityLabel.match(/[ps]\d+/))?.qualityLabel;
  const fpsVideo = fpsLabel ? extractFpsFromLabel(fpsLabel) : 30;

  const fpsStep = getFpsFromRange(qualityPreferences, fpsVideo);
  const preferredQuality = QUALITY_MAP[qualityPreferences[fpsStep]];
  const bestQuality = qualityData.find(
    data => QUALITY_NUMBER[data.quality] <= QUALITY_NUMBER[preferredQuality]
  );

  if (!bestQuality) {
    return;
  }
  elPlayer.setPlaybackQualityRange(bestQuality.quality, bestQuality.quality);
}
