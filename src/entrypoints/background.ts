import { trackExtensionInstalled, trackExtensionUpdated } from "@/lib/ythd-analytics";
import { initializeBackgroundAnalytics } from "@/lib/ythd-analytics-provider";
import { reportSettingsBaselineOnce, watchSettingChanges } from "@/lib/ythd-analytics-settings";
import { initial } from "@/lib/ythd-defaults";
import pathIconOn from "@/public/icon-128.png";
import pathIconOff from "@/public/icon-off.png";
import { storage } from "#imports";

// Firefox's native `browser` has no OnInstalledReason object to read these off, so they are
// compared as the plain strings both browsers actually deliver
const INSTALL_REASON = {
  install: "install",
  update: "update"
} as const;

function iconActions() {
  storage.watch<boolean>("local:isExtensionEnabled", isEnabled =>
    browser.action.setIcon({
      path: isEnabled ?? false ? pathIconOn : pathIconOff
    }));
}

const SDR_SCRIPT_ID = "ythd-force-sdr";

async function synchronizeSdrScript() {
  const [isExtensionEnabled, isForceSdr, registeredScripts] = await Promise.all([
    storage.getItem<boolean>("local:isExtensionEnabled", { fallback: initial.isExtensionEnabled }),
    storage.getItem<boolean>("local:isForceSdr", { fallback: initial.isForceSdr }),
    browser.scripting.getRegisteredContentScripts({ ids: [SDR_SCRIPT_ID] })
  ]);
  const isRegistered = registeredScripts.length > 0;
  const isRequired = isExtensionEnabled && isForceSdr;
  if (isRegistered === isRequired) {
    return;
  }

  if (!isRequired) {
    await browser.scripting.unregisterContentScripts({ ids: [SDR_SCRIPT_ID] });
    return;
  }

  await browser.scripting.registerContentScripts([{
    id: SDR_SCRIPT_ID,
    js: ["force-sdr.js"],
    matches: ["https://*.youtube.com/*", "https://www.youtube-nocookie.com/*", "https://youtube.googleapis.com/*"],
    allFrames: true,
    runAt: "document_start",
    world: "MAIN"
  }]);
}

export default defineBackground(async () => {
  // Synchronous and first: this registers the runtime.onConnect listener the popup connects to,
  // and a popup opening is exactly what wakes a suspended service worker
  initializeBackgroundAnalytics();
  watchSettingChanges();

  let pendingRegistration = Promise.resolve();
  function updateSdrRegistration() {
    pendingRegistration = pendingRegistration.then(synchronizeSdrScript).catch(error => {
      console.error("Failed to configure Force SDR:", error);
    });
  }

  storage.watch<boolean>("local:isForceSdr", updateSdrRegistration);
  storage.watch<boolean>("local:isExtensionEnabled", updateSdrRegistration);
  updateSdrRegistration();

  browser.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
    iconActions();

    if (String(reason) === INSTALL_REASON.install) {
      await trackExtensionInstalled();
      return;
    }

    if (String(reason) === INSTALL_REASON.update) {
      await trackExtensionUpdated({ previousVersion });
      // One shot, on the update that first ships reporting - see reportSettingsBaselineOnce
      await reportSettingsBaselineOnce();
    }
  });

  // Last, and awaited: everything above registers listeners and must stay synchronous, because a
  // cold-woken worker only receives the event that woke it if the listener already exists
  await browser.runtime.setUninstallURL("");
});
