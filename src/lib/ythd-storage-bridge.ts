import { fpsSupported, initial } from "./ythd-defaults";
import type { EnhancedBitratePreferences, QualityFpsPreferences } from "./ythd-types";
import { getStorage } from "./ythd-utils";
import { storage } from "#imports";

// This module owns the window.ythd* player globals - it seeds them and it is the only thing that
// refreshes them - so it seeds them here rather than in ythd-utils, which the background imports
// and where a bare `window` would throw in a service worker
window.ythdLastUserQualities = { ...initial.qualities };
window.ythdLastUserEnhancedBitrates = { ...initial.isEnhancedBitrates };
window.ythdIsUseSuperResolution = initial.isUseSuperResolution;

function parseStorageValue<T>(value: T | string): T {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

function sanitizeEnhancedBitrates(raw: EnhancedBitratePreferences | string | null): EnhancedBitratePreferences {
  const parsed = parseStorageValue(raw);
  return Object.fromEntries(
    fpsSupported.map(fps => [fps, parsed?.[fps] === true])
  ) as EnhancedBitratePreferences;
}

export async function loadStorageValues() {
  window.ythdLastUserQualities = await getStorage({
    area: "local",
    key: "qualities",
    fallback: window.ythdLastUserQualities
  });
  const rawEnhancedBitrates = await getStorage<EnhancedBitratePreferences | string>({
    area: "local",
    key: "isEnhancedBitrates",
    fallback: window.ythdLastUserEnhancedBitrates ?? initial.isEnhancedBitrates
  });
  window.ythdLastUserEnhancedBitrates = sanitizeEnhancedBitrates(rawEnhancedBitrates);
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

  storage.watch<EnhancedBitratePreferences | string>("local:isEnhancedBitrates", isEnhancedBitrates => {
    window.ythdLastEnhancedBitrateClicked = sanitizeEnhancedBitrates(isEnhancedBitrates ?? null);

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
