// The grammar of the vocabulary in `ythd-analytics-definitions.ts`: that file says which parameters
// may exist at all, this one says which of them mean anything on a given event. Without it every
// parameter is legal on every event, so `screen_name` could ride along on `setting_changed` and
// nothing would object until someone tried to read the report.
//
// Being a Record over GAEventName makes GA_EVENT_PARAMS exhaustive: a new event does not compile
// until its parameters are declared here, which is the moment to decide what it actually measures.
//
// Only the popup and the extension's own lifecycle report. The content scripts run on every
// YouTube page and would make the bulk of the property's volume, so they are left silent.

import { GAParam } from "./ythd-analytics-definitions";

export enum GAEventName {
  pageView = "page_view",
  settingChanged = "setting_changed",
  promotionClick = "promotion_click",
  extensionInstalled = "extension_installed",
  extensionUpdated = "extension_updated"
}

export enum GAScreenName {
  popup = "popup"
}

/** One name per preference, so renaming a storage key never silently renames a report column */
export enum GASettingName {
  extensionEnabled = "extension_enabled",
  quality = "quality",
  enhancedBitrate = "enhanced_bitrate",
  superResolution = "super_resolution",
  autoResize = "auto_resize",
  playerSize = "player_size",
  excludeVertical = "exclude_vertical",
  youTubeMusic = "youtube_music",
  globalQualityPreferences = "global_quality_preferences",
  musicQuality = "music_quality",
  hideDonationSection = "hide_donation_section"
}

export enum GAPromotionLink {
  contact = "contact",
  donate = "donate",
  rate = "rate",
  translate = "translate"
}

const NO_PARAMS = [] as const;

export const GA_EVENT_PARAMS = {
  [GAEventName.pageView]: [GAParam.screenName],
  [GAEventName.settingChanged]: [GAParam.settingName, GAParam.settingValue, GAParam.fps],
  [GAEventName.promotionClick]: [GAParam.action],
  [GAEventName.extensionInstalled]: NO_PARAMS,
  [GAEventName.extensionUpdated]: [GAParam.previousVersion]
} as const satisfies Record<GAEventName, readonly GAParam[]>;
