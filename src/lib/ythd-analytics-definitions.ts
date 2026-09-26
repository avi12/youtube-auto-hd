// GA4 keeps a custom event parameter out of every report until it is registered as a custom
// dimension on the property, and a property allows only 50 event-scoped and 25 user-scoped ones.
// So the vocabulary here is deliberately small and REUSED across events: the event name qualifies
// a value ("action=donate" on promotion_click), which is what keeps one "Action" dimension useful
// everywhere instead of a bespoke, unregistered parameter per event.
//
// This file is the single source of truth. The client can only send parameters typed from it, and
// `scripts/register-ga-custom-dimensions.ts` creates exactly these definitions in the property, so
// what ships and what is reportable can never drift apart.

/** Event-scoped parameters. Every one is registered as an EVENT custom dimension. */
export enum GAParam {
  action = "action",
  settingName = "setting_name",
  settingValue = "setting_value",
  screenName = "screen_name",
  fps = "fps",
  previousVersion = "previous_version"
}

/** Slow-changing traits of the install itself, sent on every event as user properties and
 * registered as USER custom dimensions. `ui_language` deliberately avoids the name `language`,
 * which would collide with GA4's own built-in Language dimension. */
export enum GAUserProperty {
  extensionVersion = "extension_version",
  browserName = "browser_name",
  browserVersion = "browser_version",
  operatingSystem = "operating_system",
  uiLanguage = "ui_language",
  browserLocale = "browser_locale",
  youTubeLanguage = "youtube_language",
  youTubeTimeZone = "youtube_time_zone",
  screenSize = "screen_size"
}

/** Built into GA4's reports already - sending them is right, registering them is not. */
export enum GAStandardParam {
  pageLocation = "page_location",
  pageTitle = "page_title"
}

/** @see https://support.google.com/analytics/answer/9267744 (GA4 collection limits) */
export const MAX_EVENT_PARAMS = 25;
export const MAX_PARAM_NAME_LENGTH = 40;
export const MAX_PARAM_VALUE_LENGTH = 100;
export const MAX_USER_PROPERTY_VALUE_LENGTH = 36;
export const MAX_USER_PROPERTY_NAME_LENGTH = 24;

type CustomDimension = {
  parameterName: GAParam | GAUserProperty;
  displayName: string;
  description: string;
};

// displayName is what shows up in the Explore/report dimension picker, so it reads as a person
// would say it; description is what the Admin API stores for whoever meets the dimension later.
export const GA_EVENT_DIMENSIONS = [
  {
    parameterName: GAParam.action,
    displayName: "Action",
    description: "What the user did in that event, e.g. which promotional link they opened from the popup"
  },
  {
    parameterName: GAParam.settingName,
    displayName: "Setting name",
    description: "Which preference changed: quality, enhanced bitrate, super resolution, auto-resize, player size, YouTube Music and the rest"
  },
  {
    parameterName: GAParam.settingValue,
    displayName: "Setting value",
    description: "The value the preference changed to"
  },
  {
    parameterName: GAParam.screenName,
    displayName: "Screen name",
    description: "The extension screen behind a page view, e.g. the popup"
  },
  {
    parameterName: GAParam.fps,
    displayName: "Frame rate",
    description: "The frame-rate bucket a per-frame-rate preference belongs to: 30, 50 or 60"
  },
  {
    parameterName: GAParam.previousVersion,
    displayName: "Previous version",
    description: "The extension version an update replaced. Against the extension_version user property it gives the exact hop a user took"
  }
] as const satisfies readonly CustomDimension[];

export const GA_USER_DIMENSIONS = [
  {
    parameterName: GAUserProperty.extensionVersion,
    displayName: "Extension version",
    description: "The extension version the user is running"
  },
  {
    parameterName: GAUserProperty.browserName,
    displayName: "Browser",
    description: "Which browser the extension is installed in"
  },
  {
    parameterName: GAUserProperty.browserVersion,
    displayName: "Browser version",
    description: "The browser's own version"
  },
  {
    parameterName: GAUserProperty.operatingSystem,
    displayName: "Operating system",
    description: "The platform the browser runs on: win, mac, linux, android, cros or openbsd"
  },
  {
    parameterName: GAUserProperty.uiLanguage,
    displayName: "UI language",
    description: "The language the extension's own interface renders in"
  },
  {
    parameterName: GAUserProperty.browserLocale,
    displayName: "Browser locale",
    description: "The browser's own locale, region included - can differ from the UI language the extension was translated into"
  },
  {
    parameterName: GAUserProperty.youTubeLanguage,
    displayName: "YouTube language",
    description: "The display language the viewer has chosen on YouTube itself, read from its PREF cookie. Unset means they never chose one"
  },
  {
    parameterName: GAUserProperty.youTubeTimeZone,
    displayName: "YouTube time zone",
    description: "The time zone YouTube has recorded for the viewer, the closest thing to a region the extension can read without a content script"
  },
  {
    parameterName: GAUserProperty.screenSize,
    displayName: "Screen size",
    description: "The display the popup was opened on, e.g. 3840x2160 - the default quality is picked from its height, so it explains the quality a viewer ends up on"
  }
] as const satisfies readonly CustomDimension[];

const REGISTERED_EVENT_PARAMS: ReadonlySet<string> = new Set(GA_EVENT_DIMENSIONS.map(dimension =>
  dimension.parameterName));
const STANDARD_PARAMS: ReadonlySet<string> = new Set<string>([
  ...Object.values(GAStandardParam),
  // Added by the provider on the way out; GA4 reports both natively.
  "session_id",
  "engagement_time_msec"
]);

export function isReportableParam(key: string) {
  return REGISTERED_EVENT_PARAMS.has(key) || STANDARD_PARAMS.has(key);
}
