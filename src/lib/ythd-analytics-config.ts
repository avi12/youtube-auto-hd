// The GA4 credentials, kept apart from the code that uses them so the provider and the consent
// check read the same values rather than each reaching into import.meta.env on its own.
//
// Both are build-time values from a .env file (see .env.example); a build without them collects
// nothing at all, which is what keeps a fork or a source-zip build silent by default.

const MEASUREMENT_ID: string = import.meta.env.VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID ?? "";
const API_SECRET: string = import.meta.env.VITE_GOOGLE_ANALYTICS_MEASUREMENT_API_SECRET ?? "";

export const analyticsCredentials = {
  measurementId: MEASUREMENT_ID,
  apiSecret: API_SECRET
};

export const isAnalyticsConfigured = Boolean(MEASUREMENT_ID && API_SECRET);

// The popup's real URL is a chrome-extension:// address carrying the install's extension ID, which
// has no place in a report. Page views are reported against this stand-in origin instead.
export const SYNTHETIC_PAGE_ORIGIN = "https://youtube-auto-hd.extension";
