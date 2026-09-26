import { trackExtensionInstalled, trackExtensionUpdated } from "@/lib/ythd-analytics";
import { initializeBackgroundAnalytics } from "@/lib/ythd-analytics-provider";
import { reportSettingsBaselineOnce, watchSettingChanges } from "@/lib/ythd-analytics-settings";
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

export default defineBackground(async () => {
  // Synchronous and first: this registers the runtime.onConnect listener the popup connects to,
  // and a popup opening is exactly what wakes a suspended service worker
  initializeBackgroundAnalytics();
  watchSettingChanges();

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
