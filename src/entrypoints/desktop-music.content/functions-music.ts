import type { QualityFpsPreferences, VideoQuality, YTMusicQuality } from "@/lib/types";
import { qualities } from "@/lib/ythd-setup";
import { getFpsFromRange, getVisibleElement, SELECTORS } from "@/lib/ythd-utils";

type YTMusicPlayerElement = HTMLDivElement & {
  setPlaybackQualityRange(quality1: YTMusicQuality, quality2: YTMusicQuality): void;
  getAvailableQualityLevels(): YTMusicQuality[];
  getPlaybackQuality(): YTMusicQuality;
};

const QUALITY_MAP: Record<VideoQuality, YTMusicQuality> = {
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

const QUALITY_NUMBER: Record<string, VideoQuality> = Object.fromEntries<VideoQuality>(
  Object.entries(QUALITY_MAP).map(([number, label]) => [label, qualities.find(q => q === Number(number))!])
);

async function measureVideoFps(elVideo: HTMLVideoElement) {
  return new Promise<number>(resolve => {
    let lastMediaTime = 0;
    let lastFrameNum = 0;
    const frameDiffs: number[] = [];

    function onVideoFrame(_: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) {
      if (lastMediaTime && !elVideo.paused && elVideo.playbackRate === 1) {
        const timeDiff = Math.abs(metadata.mediaTime - lastMediaTime);
        const frameDiff = Math.abs(metadata.presentedFrames - lastFrameNum);
        const diffPerFrame = timeDiff / frameDiff;

        if (diffPerFrame > 0 && diffPerFrame < 1) {
          frameDiffs.push(diffPerFrame);
          if (frameDiffs.length > 30) {
            frameDiffs.shift();
          }

          if (frameDiffs.length === 30) {
            const averageDiff = frameDiffs.reduce((sum, diff) => sum + diff) / frameDiffs.length;
            resolve(Math.round(1 / averageDiff));
            return;
          }
        }
      }

      lastMediaTime = metadata.mediaTime;
      lastFrameNum = metadata.presentedFrames;
      elVideo.requestVideoFrameCallback(onVideoFrame);
    }

    elVideo.requestVideoFrameCallback(onVideoFrame);
  });
}

export async function applyQualityOnMusic(qualities: QualityFpsPreferences) {
  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!elVideo) {
    return;
  }

  const elYTMusicPlayer = getVisibleElement<YTMusicPlayerElement>(SELECTORS.player);
  const availableQualities = elYTMusicPlayer.getAvailableQualityLevels();
  const fpsCurrent = await measureVideoFps(elVideo);
  const fpsStep = getFpsFromRange(qualities, fpsCurrent);
  const preferredQuality = QUALITY_MAP[qualities[fpsStep]];
  const iPreferredQuality = availableQualities.findIndex(
    quality => QUALITY_NUMBER[quality] <= QUALITY_NUMBER[preferredQuality]
  );

  const bestQuality = availableQualities.at(iPreferredQuality > -1 ? iPreferredQuality : -2)!;
  elYTMusicPlayer.setPlaybackQualityRange(bestQuality, bestQuality);
  console.log("[YTHD] Applied quality", elYTMusicPlayer.getPlaybackQuality());
}
