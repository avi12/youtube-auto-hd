import { browser } from "#imports";

// YouTube keeps the viewer's chosen display language and time zone in its own PREF cookie, which
// the background can read straight off the cookie store - no content script, no MAIN-world bridge.
//
// The content country (GL) is deliberately NOT here. It lives only on window.ytcfg, which is
// reachable from the MAIN world and nowhere else, and reporting is popup-only - so it is left
// unreported rather than guessed at from the browser locale, which is a different thing entirely.
const YOUTUBE_URL = "https://www.youtube.com/";
const COOKIE_PREFERENCES = "PREF";
const PARAM_LANGUAGE = "hl";
const PARAM_TIME_ZONE = "tz";

type YouTubePreferences = {
  language: string;
  timeZone: string;
};

// The cookie cannot change without a YouTube visit, and a service worker rarely outlives one, so
// one read per worker is plenty
let preferencesPromise: Promise<YouTubePreferences> | undefined;

function getIsValidLocale(locale: string) {
  try {
    return Intl.getCanonicalLocales(locale).length > 0;
  } catch {
    return false;
  }
}

/** Keeps the most specific still-valid prefix, so a stale "en-GB-IN" (two region subtags, which
 * every Intl constructor rejects) recovers to "en-GB" rather than being thrown away. Unlike the
 * Video Time Manager version this falls back to an empty string, not the browser locale: reporting
 * the browser's locale as YouTube's would quietly turn "never set" into a wrong answer. */
export function toValidLocale(locale: string) {
  const subtags = locale.split("-");
  return [...subtags.keys()]
    .map(dropCount => subtags.slice(0, subtags.length - dropCount).join("-"))
    .find(prefix => getIsValidLocale(prefix)) ?? "";
}

async function readPreferences(): Promise<YouTubePreferences> {
  try {
    const cookie = await browser.cookies.get({
      url: YOUTUBE_URL,
      name: COOKIE_PREFERENCES
    });
    // PREF is "&"-joined key=value pairs - exactly a query string
    const preferences = new URLSearchParams(cookie?.value ?? "");
    return {
      language: toValidLocale(preferences.get(PARAM_LANGUAGE) ?? ""),
      // YouTube writes it with dots, e.g. "Asia.Jerusalem"
      timeZone: (preferences.get(PARAM_TIME_ZONE) ?? "").replaceAll(".", "/")
    };
  } catch {
    return {
      language: "",
      timeZone: ""
    };
  }
}

export function getYouTubePreferences() {
  preferencesPromise ??= readPreferences();
  return preferencesPromise;
}
