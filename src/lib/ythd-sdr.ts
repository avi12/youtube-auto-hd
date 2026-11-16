export function getSdrMediaQuery(query: string): string {
  return query.replace(/\(\s*(?:video-)?dynamic-range\s*:\s*high\s*\)/gi, "(width < 0px)");
}

export function isHdrVideoConfiguration(video?: VideoConfiguration): boolean {
  return video?.transferFunction === "pq"
    || video?.transferFunction === "hlg"
    || video?.hdrMetadataType !== undefined;
}

export function installSdrCapabilities() {
  const nativeMatchMedia = window.matchMedia;
  window.matchMedia = function (this: Window, query: string) {
    return nativeMatchMedia.call(this, typeof query === "string" ? getSdrMediaQuery(query) : query);
  };

  const mediaCapabilities = navigator.mediaCapabilities;
  const nativeDecodingInfo = mediaCapabilities.decodingInfo;
  mediaCapabilities.decodingInfo = function (this: MediaCapabilities, configuration: MediaDecodingConfiguration) {
    return nativeDecodingInfo.call(this, configuration).then(info => {
      if (!isHdrVideoConfiguration(configuration.video)) {
        return info;
      }

      info.supported = false;
      info.smooth = false;
      info.powerEfficient = false;
      return info;
    });
  };
}
