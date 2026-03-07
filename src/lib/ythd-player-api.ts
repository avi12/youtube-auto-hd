import { qualities } from "./ythd-defaults";
import type { QualityFpsPreferences, VideoQuality, YTMusicQuality } from "./ythd-types";
import { getFpsFromRange, getPlayerDiv, getVisibleElement, SELECTORS } from "./ythd-utils";

type YTPlayerElement = HTMLDivElement & {
  setPlaybackQualityRange(quality1: YTMusicQuality, quality2: YTMusicQuality): void;
  getAvailableQualityLevels(): YTMusicQuality[];
  getPlaybackQuality(): YTMusicQuality;
};

/** @see https://gist.github.com/Araxeus/fc574d0f31ba71d62215c0873a7b048e
    @see Official docs: https://developers.google.com/youtube/iframe_api_reference#Playback_quality
  */
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

async function measureVideoFps(elVideo: HTMLVideoElement) {
  return new Promise<number>(resolve => {
    let lastMediaTime = 0;
    let lastFrameNum = 0;
    let sampleSum = 0;
    let sampleCount = 0;

    function onVideoFrame(_: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) {
      if (lastMediaTime && !elVideo.paused) {
        const timeDiff = metadata.mediaTime - lastMediaTime;
        const frameDiff = metadata.presentedFrames - lastFrameNum;
        const diffPerFrame = timeDiff / frameDiff / elVideo.playbackRate;

        if (diffPerFrame > 0 && diffPerFrame < 1) {
          sampleSum += diffPerFrame;
          sampleCount++;

          if (sampleCount === 30) {
            const fps = sampleCount / sampleSum;
            resolve(fps);
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

export async function changeQualityViaPlayerAPI(qualityPreferences: QualityFpsPreferences) {
  const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
  if (!elVideo) {
    return;
  }

  const elPlayer = getPlayerDiv<YTPlayerElement>(elVideo);
  if (!elPlayer) {
    return;
  }

  const availableQualities = elPlayer.getAvailableQualityLevels();
  const fpsCurrent = await measureVideoFps(elVideo);
  const fpsStep = getFpsFromRange(qualityPreferences, fpsCurrent);
  const preferredQuality = QUALITY_MAP[qualityPreferences[fpsStep]];
  const iPreferredQuality = availableQualities.findIndex(
    quality => QUALITY_NUMBER[quality] <= QUALITY_NUMBER[preferredQuality]
  );

  const bestQuality = availableQualities.at(iPreferredQuality > -1 ? iPreferredQuality : -2);
  if (!bestQuality) {
    return;
  }
  elPlayer.setPlaybackQualityRange(bestQuality, bestQuality);
  console.log("[YTHD] Applied quality", elPlayer.getPlaybackQuality());
}
