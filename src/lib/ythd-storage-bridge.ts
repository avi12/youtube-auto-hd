import type { EnhancedBitratePreferences, QualityFpsPreferences } from "./ythd-types";
import { getStorage } from "./ythd-utils";
import { storage } from "#imports";

export async function loadStorageValues() {
  window.ythdLastUserQualities = await getStorage({
    area: "local",
    key: "qualities",
    fallback: window.ythdLastUserQualities
  });
  window.ythdLastUserEnhancedBitrates = await getStorage({
    area: "local",
    key: "isEnhancedBitrates",
    fallback: window.ythdLastUserEnhancedBitrates
  });
  window.ythdIsUseSuperResolution = await getStorage({
    area: "local",
    key: "isUseSuperResolution",
    fallback: window.ythdIsUseSuperResolution
  });
}

export function addStorageListeners(onApply: () => void) {
  storage.watch<boolean>("local:isExtensionEnabled", isExtEnabled => {
    window.ythdExtEnabled = isExtEnabled ?? false;
    if (!isExtEnabled) {
      return;
    }
    onApply();
  });

  storage.watch<QualityFpsPreferences>("local:qualities", qualityPreferences => {
    window.ythdLastUserQualities = qualityPreferences;
    window.ythdLastQualityClicked = undefined;
    window.ythdLastEnhancedBitrateClicked = {};
    if (!window.ythdExtEnabled) {
      return;
    }
    onApply();
  });

  storage.watch<EnhancedBitratePreferences>("local:isEnhancedBitrates", isEnhancedBitrates => {
    window.ythdLastEnhancedBitrateClicked = isEnhancedBitrates ?? undefined;
    if (!window.ythdExtEnabled) {
      return;
    }
    onApply();
  });

  storage.watch<boolean>("local:isUseSuperResolution", isUseSuperResolution => {
    window.ythdIsUseSuperResolution = isUseSuperResolution ?? undefined;
    if (!window.ythdExtEnabled) {
      return;
    }
    onApply();
  });
}
