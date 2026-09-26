import { setAnalytics } from "./ythd-analytics-client";
import { analyticsCredentials, SYNTHETIC_PAGE_ORIGIN } from "./ythd-analytics-config";
import { getIsAnalyticsEnabled, resolveClientId } from "./ythd-analytics-consent";
import {
  GAUserProperty,
  MAX_EVENT_PARAMS,
  MAX_PARAM_NAME_LENGTH,
  MAX_PARAM_VALUE_LENGTH,
  MAX_USER_PROPERTY_NAME_LENGTH,
  MAX_USER_PROPERTY_VALUE_LENGTH
} from "./ythd-analytics-definitions";
import { GAEventName } from "./ythd-analytics-events";
import { browserName, browserVersion } from "./ythd-stores";
import { getYouTubePreferences } from "./ythd-youtube-preferences";
import { z } from "./ythd-zod";
import { createAnalytics, defineAnalyticsProvider } from "@wxt-dev/analytics";
import type { AnalyticsConfig } from "@wxt-dev/analytics/types";
import { storage } from "#imports";

/** @see https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference#query_parameters */
interface GACollectQueryParams {
  measurement_id: string;
  api_secret: string;
}

/** @see https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference#payload_post_body */
interface GACollectRequestBody {
  client_id: string;
  timestamp_micros: number;
  user_properties: Record<string, { value: string }>;
  consent: {
    ad_user_data: "DENIED";
    ad_personalization: "DENIED";
  };
  events: Array<{
    name: string;
    params: Record<string, unknown>;
  }>;
}

// Storage is the one input here that has already been seen to come back malformed (a settings
// value double-serialized by an older build), and a session with a NaN timestamp would keep every
// later hit inside one endless session. Anything that does not parse starts a fresh session.
const gaSessionSchema = z.object({
  sessionId: z.string().min(1),
  timestamp: z.number().finite()
});

type SessionData = z.infer<typeof gaSessionSchema>;

const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const KEY_SESSION = "local:gaSession";
const KEY_SCREEN_SIZE = "local:gaScreenSize";
const SESSION_EXPIRATION_IN_MINUTES = 30;
const MIN_ENGAGEMENT_TIME_MSEC = 100;
const MAX_ENGAGEMENT_TIME_MSEC = 60_000;
const MILLISECONDS_PER_MINUTE = 60_000;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
const MICROSECONDS_PER_MILLISECOND = 1000;
// GA4 discards a hit stamped more than 72 hours in the past, so a clock that is wrong by more than
// that would silently lose every event it sent
const MAX_BACKDATE_MILLISECONDS = 72 * MILLISECONDS_PER_HOUR;
const DENYLISTED_PARAM_KEYS: ReadonlySet<string> = new Set(["email", "name", "phone", "address", "page_referrer"]);

function clampEngagementTime(elapsedMilliseconds: number) {
  return Math.min(Math.max(elapsedMilliseconds, MIN_ENGAGEMENT_TIME_MSEC), MAX_ENGAGEMENT_TIME_MSEC);
}

function getIsParamAllowed({ key, value }: {
  key: string;
  value: unknown;
}) {
  if (DENYLISTED_PARAM_KEYS.has(key)) {
    return false;
  }

  const isNonString = typeof value !== "string";
  if (isNonString) {
    return true;
  }

  const isTooLong = value.length > MAX_PARAM_VALUE_LENGTH;
  if (isTooLong) {
    return false;
  }

  return !value.startsWith("http") || value.startsWith(SYNTHETIC_PAGE_ORIGIN);
}

// A belt-and-braces pass over whatever a caller handed us: nothing that could carry a person's
// identity, and no URL other than the synthetic one this extension makes up for its own screens
function dropDisallowedParams(params: Record<string, unknown>) {
  for (const [key, value] of Object.entries(params)) {
    if (!getIsParamAllowed({
      key,
      value
    })) {
      delete params[key];
    }
  }
}

// GA4 rejects the whole event when it carries more than 25 parameters or a name over 40
// characters, and it silently ignores a parameter that no custom dimension is registered for.
// Enforcing both here means a hit is never lost to a limit, and a parameter that would land
// nowhere is caught in debug rather than quietly missing from a report weeks later.
function enforceCollectionLimits(params: Record<string, unknown>) {
  const kept: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    const isOverParamBudget = Object.keys(kept).length >= MAX_EVENT_PARAMS;
    const isNameTooLong = key.length > MAX_PARAM_NAME_LENGTH;
    if (isOverParamBudget || isNameTooLong) {
      continue;
    }

    kept[key] = value;
  }

  return kept;
}

// The platform cannot change under a running worker, so one call answers every hit
let platformPromise: Promise<{ os: string }> | undefined;

function getPlatformInfo() {
  platformPromise ??= browser.runtime.getPlatformInfo().catch(() => ({ os: "" }));
  return platformPromise;
}

// Only a frontend context knows the display it is on; the worker has no `screen`. The popup's own
// metadata carries it, so the first popup event of an install teaches the worker the screen size
// and every later background-born event reports the same one.
async function resolveScreenSize(reportedScreenSize: string | undefined) {
  if (reportedScreenSize) {
    await storage.setItem(KEY_SCREEN_SIZE, reportedScreenSize);
    return reportedScreenSize;
  }

  return await storage.getItem<string>(KEY_SCREEN_SIZE) ?? "";
}

// User properties describe the install rather than the moment, so GA4 keeps the latest value
// against the user and EVERY event inherits it - which is why none of this is repeated as an event
// parameter, where it would burn both the 25-per-event budget and the 50 event-dimension cap.
// Names are capped at 24 characters and values at 36, so both are enforced rather than trusted.
async function buildUserProperties(reportedScreenSize: string | undefined) {
  const [platform, youTube, screenSize] = await Promise.all([
    getPlatformInfo(),
    getYouTubePreferences(),
    resolveScreenSize(reportedScreenSize)
  ]);

  const values: Record<GAUserProperty, string> = {
    [GAUserProperty.extensionVersion]: browser.runtime.getManifest().version,
    [GAUserProperty.browserName]: browserName,
    [GAUserProperty.browserVersion]: browserVersion,
    [GAUserProperty.operatingSystem]: platform.os,
    [GAUserProperty.uiLanguage]: browser.i18n.getUILanguage(),
    [GAUserProperty.browserLocale]: navigator.language,
    [GAUserProperty.youTubeLanguage]: youTube.language,
    [GAUserProperty.youTubeTimeZone]: youTube.timeZone,
    [GAUserProperty.screenSize]: screenSize
  };

  const userProperties: Record<string, { value: string }> = {};
  for (const [name, value] of Object.entries(values)) {
    if (value && name.length <= MAX_USER_PROPERTY_NAME_LENGTH) {
      userProperties[name] = { value: value.slice(0, MAX_USER_PROPERTY_VALUE_LENGTH) };
    }
  }

  return userProperties;
}

function toTimestampMicros(occurredAtMilliseconds: number) {
  const now = Date.now();
  const oldestAllowedMilliseconds = now - MAX_BACKDATE_MILLISECONDS;
  const stampedMilliseconds = Math.min(Math.max(occurredAtMilliseconds, oldestAllowedMilliseconds), now);
  return stampedMilliseconds * MICROSECONDS_PER_MILLISECOND;
}

async function readSession() {
  const stored = await storage.getItem<SessionData>(KEY_SESSION);
  const parsed = gaSessionSchema.safeParse(stored);
  return parsed.success ? parsed.data : null;
}

async function advanceSession() {
  const previousSession = await readSession();
  const currentTime = Date.now();
  const elapsedSinceLastEvent = previousSession ? currentTime - previousSession.timestamp : null;
  const isExpired =
    elapsedSinceLastEvent !== null && elapsedSinceLastEvent / MILLISECONDS_PER_MINUTE > SESSION_EXPIRATION_IN_MINUTES;
  const isNewSession = !previousSession || isExpired;
  const sessionId = isNewSession ? currentTime.toString() : previousSession.sessionId;

  await storage.setItem(KEY_SESSION, {
    sessionId,
    timestamp: currentTime
  });

  const engagementTime =
    isNewSession || elapsedSinceLastEvent === null
      ? MIN_ENGAGEMENT_TIME_MSEC
      : clampEngagementTime(elapsedSinceLastEvent);
  return {
    sessionId,
    engagementTime
  };
}

// Two events reported in the same tick - a popup that opens and immediately writes a preference -
// would otherwise both read the stored session, both decide it is missing or expired, and both
// write one back, splitting one session in two. Each read-modify-write waits for the one before it.
let sessionQueue: Promise<unknown> = Promise.resolve();

function getOrCreateSession() {
  const session = sessionQueue.then(advanceSession);
  sessionQueue = session.catch(() => undefined);
  return session;
}

const ga4Provider = defineAnalyticsProvider<typeof analyticsCredentials>((_analytics, _config, options) => {
  async function send({ name, params, timestamp, screenSize }: {
    name: string;
    params: Record<string, unknown>;
    timestamp: number;
    screenSize: string | undefined;
  }) {
    try {
      const session = await getOrCreateSession();
      dropDisallowedParams(params);
      params.session_id = session.sessionId;
      params.engagement_time_msec = session.engagementTime;
      const eventParams = enforceCollectionLimits(params);
      const query = new URLSearchParams({
        measurement_id: options.measurementId,
        api_secret: options.apiSecret
      } satisfies GACollectQueryParams);
      const body: GACollectRequestBody = {
        client_id: await resolveClientId(),
        timestamp_micros: toTimestampMicros(timestamp),
        user_properties: await buildUserProperties(screenSize),
        consent: {
          ad_user_data: "DENIED",
          ad_personalization: "DENIED"
        },
        events: [{
          name,
          params: eventParams
        }]
      };

      await fetch(`${GA_ENDPOINT}?${query}`, {
        method: "POST",
        body: JSON.stringify(body),
        keepalive: true
      });
    } catch (error) {
      console.error("[YTHD][analytics] Google Analytics request failed", error);
    }
  }

  return {
    async track(event) {
      await send({
        name: event.event.name,
        params: {
          ...event.event.properties
        },
        timestamp: event.meta.timestamp,
        screenSize: event.meta.screen
      });
    },
    async page(event) {
      await send({
        name: GAEventName.pageView,
        params: {
          page_location: event.page.location ?? event.page.url,
          page_title: event.page.title
        },
        timestamp: event.meta.timestamp,
        screenSize: event.meta.screen
      });
    },
    async identify() {}
  };
});

// `enabled` is asked before every hit, so a build that should not report cannot start reporting
// halfway through a worker's life.
const analyticsConfig: AnalyticsConfig = {
  providers: [ga4Provider(analyticsCredentials)],
  enabled: {
    getValue: getIsAnalyticsEnabled
  },
  userId: {
    getValue: resolveClientId
  },
  // The GA4 provider builds its own user properties from the install, so the library's default
  // storage-backed bag would only add an unused storage key
  userProperties: {
    getValue: () => ({})
  }
};

/** Call synchronously at background startup: creating the client is what registers the
 * runtime.onConnect listener every other context forwards its events down. This module is the
 * only one that pulls the provider - and with it the credentials - into a bundle. */
export function initializeBackgroundAnalytics() {
  setAnalytics(createAnalytics(analyticsConfig));
}
