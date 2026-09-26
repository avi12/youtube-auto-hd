import { getAnalytics } from "./ythd-analytics-client";
import { SYNTHETIC_PAGE_ORIGIN } from "./ythd-analytics-config";
import { GAParam, GAStandardParam } from "./ythd-analytics-definitions";
import {
  GA_EVENT_PARAMS,
  GAEventName,
  type GAPromotionLink,
  GAScreenName,
  type GASettingName
} from "./ythd-analytics-events";

type GAParamValue = string | number | boolean | undefined;

// Indexing through `keyof` rather than straight into the plan keeps a missing entry to ONE error,
// in the plan itself, instead of cascading unindexable-type noise through every helper here.
type GAEventParamName<TName extends GAEventName> = TName extends keyof typeof GA_EVENT_PARAMS
  ? (typeof GA_EVENT_PARAMS)[TName][number]
  : never;

/** Only the parameters the tracking plan lists for THIS event, so the type system - not a reviewer
 * - catches both a parameter with no registered dimension and one that means nothing on the event
 * it was attached to. An event the plan gives no parameters accepts none. */
type GAEventParams<TName extends GAEventName> = [GAEventParamName<TName>] extends [never]
  ? Record<string, never>
  : Partial<Record<GAEventParamName<TName>, GAParamValue>>;

type TrackedParams = Partial<Record<GAParam, GAParamValue>> & Partial<Record<GAStandardParam, string>>;

function toAnalyticsProperties(params: TrackedParams) {
  const properties: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      properties[key] = String(value);
    }
  }

  return properties;
}

// Every reporter awaits this, so a caller that is about to tear its own context down - the popup
// opening a link and closing itself - knows the event left before it goes. It never rejects and
// never throws: telemetry must not be able to break the action it is reporting on.
async function track({ name, params }: {
  name: GAEventName;
  params: TrackedParams;
}) {
  try {
    const analytics = await getAnalytics();
    if (!analytics) {
      return;
    }

    await analytics.track(name, toAnalyticsProperties(params));
  } catch (error) {
    console.debug("[YTHD][analytics] Failed to reach the background", error);
  }
}

export async function trackEvent<TName extends GAEventName>({ name, params = {} }: {
  name: TName;
  params?: GAEventParams<TName>;
}) {
  await track({
    name,
    params
  });
}

// The extension version, browser and UI language ride along as user properties on every event, so
// none of them needs repeating here - only what this event alone knows does.
export async function trackPopupOpened() {
  await track({
    name: GAEventName.pageView,
    params: {
      [GAStandardParam.pageLocation]: `${SYNTHETIC_PAGE_ORIGIN}/popup`,
      [GAStandardParam.pageTitle]: "Popup",
      [GAParam.screenName]: GAScreenName.popup
    }
  });
}

/** `fps` is set only for the per-frame-rate preferences, where the same setting holds one value
 * per frame-rate bucket and a single reported value would hide which bucket moved. */
export async function trackSettingChanged({ setting, value, fps }: {
  setting: GASettingName;
  value: string;
  fps?: number;
}) {
  await trackEvent({
    name: GAEventName.settingChanged,
    params: {
      [GAParam.settingName]: setting,
      [GAParam.settingValue]: value,
      [GAParam.fps]: fps
    }
  });
}

// The version installed is already on every event as a user property, so only the version an
// update REPLACED is worth carrying here - the pair is what makes an upgrade path readable.
export async function trackExtensionInstalled() {
  await trackEvent({ name: GAEventName.extensionInstalled });
}

export async function trackExtensionUpdated({ previousVersion }: { previousVersion?: string }) {
  await trackEvent({
    name: GAEventName.extensionUpdated,
    params: {
      [GAParam.previousVersion]: previousVersion
    }
  });
}

export async function trackPromotionClick({ link }: { link: GAPromotionLink }) {
  await trackEvent({
    name: GAEventName.promotionClick,
    params: {
      [GAParam.action]: link
    }
  });
}
