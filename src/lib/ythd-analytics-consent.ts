import { isAnalyticsConfigured } from "./ythd-analytics-config";
import { browser, storage } from "#imports";

const KEY_CLIENT_ID = "local:gaClientId";
const DATA_COLLECTION_PERMISSION = "technicalAndInteraction";

// Two callers racing on a fresh install would otherwise mint two ids and split one install in two
let clientIdPromise: Promise<string> | undefined;

// Mozilla only accepts `technicalAndInteraction` as an OPTIONAL data collection permission - its
// whole point is that this kind of data stays refusable - so on Firefox the install prompt asks,
// and the answer is honoured here. Anything else reads as granted: Chrome has no such concept and
// returns no `data_collection` at all, and neither does a Firefox old enough to predate the field,
// where nothing was ever asked and nothing can be revoked.
async function getIsDataCollectionGranted() {
  // The field exists only where the concept does, which is why its absence reads as granted
  // rather than denied - the Chrome types have never heard of it either.
  const permissions: object = await browser.permissions.getAll();
  if (!("data_collection" in permissions)) {
    return true;
  }

  const granted = permissions.data_collection;
  return Array.isArray(granted) && granted.includes(DATA_COLLECTION_PERMISSION);
}

// Production builds only, with no dev escape hatch: `pnpm dev` and every `--mode development`
// build report nothing, so a session spent toggling settings can never reach a report. The store
// builds are the only ones that send.
export async function getIsAnalyticsEnabled() {
  if (!isAnalyticsConfigured || !import.meta.env.PROD) {
    return false;
  }

  return getIsDataCollectionGranted();
}

/** A random id per install, and nothing else: it is what lets GA4 count people rather than hits,
 * and it is deliberately unconnected to anything the browser or YouTube knows about the user */
export async function resolveClientId() {
  clientIdPromise ??= (async () => {
    const existing = await storage.getItem<string>(KEY_CLIENT_ID);
    if (existing) {
      return existing;
    }

    const clientId = crypto.randomUUID();
    await storage.setItem(KEY_CLIENT_ID, clientId);
    return clientId;
  })();

  return clientIdPromise;
}
