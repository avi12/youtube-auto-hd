import { isAnalyticsConfigured } from "./ythd-analytics-config";
import { storage } from "#imports";

const KEY_CLIENT_ID = "local:gaClientId";

// Two callers racing on a fresh install would otherwise mint two ids and split one install in two
let clientIdPromise: Promise<string> | undefined;

// Production builds only, with no dev escape hatch: `pnpm dev` and every `--mode development`
// build report nothing, so a session spent toggling settings can never reach a report. The store
// builds are the only ones that send.
//
// Firefox is told `technicalAndInteraction` is REQUIRED, which means it is granted at install and
// cannot be turned off - so there is nothing to ask at runtime either. Checking permissions.getAll()
// here would only add a way to be wrong: if Firefox lists just the revocable permissions, the check
// reads "denied" on every Firefox install and loses the lot without saying so.
export function getIsAnalyticsEnabled() {
  return isAnalyticsConfigured && import.meta.env.PROD;
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
