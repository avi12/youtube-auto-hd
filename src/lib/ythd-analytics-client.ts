import type { Analytics, AnalyticsConfig } from "@wxt-dev/analytics/types";
import { browser } from "#imports";

// Outside the background, createAnalytics() only opens a runtime port and forwards every call down
// it - the providers, the credentials and the consent check all live on the background end, which
// is the only context that can reach google-analytics.com without tripping CORS. So a frontend
// context has nothing to configure, and passing the real config here would drag the provider (and
// the API secret) into the popup bundle for no reason.
const FORWARDING_ONLY_CONFIG: AnalyticsConfig = { providers: [] };

// @wxt-dev/analytics ships a WXT module that injects `import "#analytics"` into every entrypoint,
// which opens that port on every YouTube tab the content scripts run in and keeps the service
// worker awake for as long as one is open. The module is deliberately not registered; the client
// is created here instead - and only ever once, so the background's fully configured client is
// never shadowed by a forwarding one when the background reports something itself.
let analyticsPromise: Promise<Analytics> | null = null;

/** Background only: the configured client, primed at startup so the popup's port finds
 * runtime.onConnect already listening when it wakes the service worker. */
export function setAnalytics(analytics: Analytics) {
  analyticsPromise = Promise.resolve(analytics);
}

/** Null in a context whose runtime has been invalidated - an extension reload leaves an orphaned
 * popup behind, and createAnalytics() throws there rather than no-opping. The library is pulled in
 * dynamically so it stays out of the popup's first paint. */
export async function getAnalytics() {
  if (!browser?.runtime?.id) {
    return null;
  }

  analyticsPromise ??= import("@wxt-dev/analytics")
    .then(({ createAnalytics }) => createAnalytics(FORWARDING_ONLY_CONFIG));
  return analyticsPromise;
}
