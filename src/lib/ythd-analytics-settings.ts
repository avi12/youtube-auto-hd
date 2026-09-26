// Every preference the popup writes, reported from ONE place. Watching the storage keys rather
// than instrumenting each `$effect` means a new control reports itself as soon as it persists
// anything, a popup that closes the instant after a toggle still gets its event out (the service
// worker outlives it), and no component has to know analytics exists.

import { trackSettingChanged } from "./ythd-analytics";
import { getIsAnalyticsEnabled } from "./ythd-analytics-consent";
import { GASettingName } from "./ythd-analytics-events";
import { initial } from "./ythd-defaults";
import { z } from "./ythd-zod";
import { storage, type StorageItemKey } from "#imports";

type SettingChange = {
  value: string;
  fps?: number;
};

type TrackedSetting = {
  key: StorageItemKey;
  name: GASettingName;
  // What the extension behaves as when the key was never written. Taken from `initial` so the
  // baseline below reports what a user is actually running, not "unset".
  fallback: unknown;
  getChanges: (newValue: unknown, oldValue: unknown) => SettingChange[];
};

// Reporting starts mid-life for everyone who already has the extension, and setting_changed only
// ever fires on a change - so an install whose owner is happy with their settings would never
// appear in a report at all. The update that introduces reporting sends each preference once, at
// whatever it is currently set to. Guarded by its own flag rather than a version number, so no
// later update can repeat it.
const KEY_BASELINE_REPORTED = "local:isSettingsBaselineReported";

// A quality slider writes on every step it passes through, so one drag from 1080p to 360p would
// otherwise report every rung of the ladder. Only the value the handle is left on is reported.
const SETTING_CHANGE_DEBOUNCE_MILLISECONDS = 1000;

// An older build once persisted a preference as a JSON string rather than an object, so what
// comes back is parsed rather than trusted - a malformed record reports nothing instead of
// reporting "[object Object]" against every frame rate
const perFrameRateRecordSchema = z.record(z.string(), z.unknown());

const pendingChanges = new Map<string, ReturnType<typeof setTimeout>>();

function getScalarChanges(newValue: unknown, oldValue: unknown): SettingChange[] {
  const isUnchanged = newValue === oldValue || newValue === null || newValue === undefined;
  if (isUnchanged) {
    return [];
  }

  return [{ value: String(newValue) }];
}

function toRecord(value: unknown) {
  const parsed = perFrameRateRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

// The per-frame-rate preferences are one record of three values, and a change to any of them
// rewrites the whole record - so the event has to name the bucket that actually moved
function getRecordChanges(newValue: unknown, oldValue: unknown): SettingChange[] {
  const newRecord = toRecord(newValue);
  const oldRecord = toRecord(oldValue);
  const changes: SettingChange[] = [];
  for (const fps in newRecord) {
    if (newRecord[fps] === oldRecord[fps]) {
      continue;
    }

    changes.push({
      value: String(newRecord[fps]),
      fps: Number(fps)
    });
  }

  return changes;
}

const TRACKED_SETTINGS: TrackedSetting[] = [
  {
    key: "local:isExtensionEnabled",
    name: GASettingName.extensionEnabled,
    fallback: initial.isExtensionEnabled,
    getChanges: getScalarChanges
  },
  {
    key: "local:qualities",
    name: GASettingName.quality,
    fallback: initial.qualities,
    getChanges: getRecordChanges
  },
  {
    key: "local:isEnhancedBitrates",
    name: GASettingName.enhancedBitrate,
    fallback: initial.isEnhancedBitrates,
    getChanges: getRecordChanges
  },
  {
    key: "local:isUseSuperResolution",
    name: GASettingName.superResolution,
    fallback: initial.isUseSuperResolution,
    getChanges: getScalarChanges
  },
  {
    key: "local:isEnableYouTubeMusic",
    name: GASettingName.youTubeMusic,
    fallback: initial.isEnableYouTubeMusic,
    getChanges: getScalarChanges
  },
  {
    key: "local:isUseGlobalQualityPreferences",
    name: GASettingName.globalQualityPreferences,
    fallback: initial.isUseGlobalQualityPreferences,
    getChanges: getScalarChanges
  },
  {
    key: "local:qualitiesMusic",
    name: GASettingName.musicQuality,
    fallback: initial.qualities,
    getChanges: getRecordChanges
  },
  {
    key: "sync:autoResize",
    name: GASettingName.autoResize,
    fallback: initial.isResizeVideo,
    getChanges: getScalarChanges
  },
  {
    key: "sync:size",
    name: GASettingName.playerSize,
    fallback: initial.size,
    getChanges: getScalarChanges
  },
  {
    key: "sync:isExcludeVertical",
    name: GASettingName.excludeVertical,
    fallback: initial.isExcludeVertical,
    getChanges: getScalarChanges
  },
  {
    key: "sync:isHideDonationSection",
    name: GASettingName.hideDonationSection,
    fallback: initial.isHideDonationSection,
    getChanges: getScalarChanges
  }
];

function trackDebounced({ name, change }: {
  name: GASettingName;
  change: SettingChange;
}) {
  const changeKey = `${name}:${change.fps ?? ""}`;
  clearTimeout(pendingChanges.get(changeKey));
  pendingChanges.set(
    changeKey,
    setTimeout(async () => {
      pendingChanges.delete(changeKey);
      await trackSettingChanged({
        setting: name,
        value: change.value,
        fps: change.fps
      });
    }, SETTING_CHANGE_DEBOUNCE_MILLISECONDS)
  );
}

/** Call once, from the update that first ships reporting. Does nothing on every later update, and
 * nothing at all in a build that cannot report - otherwise a dev run would burn the one shot and
 * the real update would stay silent. */
export async function reportSettingsBaselineOnce() {
  if (!getIsAnalyticsEnabled()) {
    return;
  }

  const isReported = await storage.getItem<boolean>(KEY_BASELINE_REPORTED);
  if (isReported) {
    return;
  }

  // Claimed before the reporting starts: at most once is the requirement, so a worker that dies
  // mid-run loses the rest of the baseline rather than sending a second one later
  await storage.setItem(KEY_BASELINE_REPORTED, true);

  for (const setting of TRACKED_SETTINGS) {
    const value = await storage.getItem<unknown>(setting.key) ?? setting.fallback;
    for (const change of setting.getChanges(value, undefined)) {
      await trackSettingChanged({
        setting: setting.name,
        value: change.value,
        fps: change.fps
      });
    }
  }
}

export function watchSettingChanges() {
  for (const setting of TRACKED_SETTINGS) {
    storage.watch<unknown>(setting.key, (newValue, oldValue) => {
      for (const change of setting.getChanges(newValue, oldValue)) {
        trackDebounced({
          name: setting.name,
          change
        });
      }
    });
  }
}
