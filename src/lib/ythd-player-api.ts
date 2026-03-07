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
    // Number of frame duration samples to average before resolving FPS
    const SAMPLES_REQUIRED = 30;
    let lastMediaTime = 0;
    let lastFrameNum = 0;
    let secondsPerFrameSum = 0;
    let sampleCount = 0;

    function onVideoFrame(_: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) {
      if (lastMediaTime && !elVideo.paused) {
        const elapsedMediaSeconds = metadata.mediaTime - lastMediaTime;
        const elapsedFrames = metadata.presentedFrames - lastFrameNum;
        // Normalize by playbackRate so the measurement is accurate at any speed
        const secondsPerFrame = elapsedMediaSeconds / elapsedFrames / elVideo.playbackRate;

        const isValidSample = secondsPerFrame > 0 && secondsPerFrame < 1;
        if (isValidSample) {
          secondsPerFrameSum += secondsPerFrame;
          sampleCount++;

          if (sampleCount === SAMPLES_REQUIRED) {
            const fps = sampleCount / secondsPerFrameSum;
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

let latestCallId = 0;

export async function changeQualityViaPlayerAPI(qualityPreferences: QualityFpsPreferences) {
  const callId = ++latestCallId;

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

  // A newer call came in while measuring FPS — discard this stale result
  if (callId !== latestCallId) {
    return;
  }

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
