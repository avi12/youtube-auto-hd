import type { QualityFpsPreferences } from "./ythd-types";
import { defineCustomEventMessaging } from "@webext-core/messaging/page";

export enum ShortsMessage {
  APPLY_QUALITY = "applyQuality"
}

type ShortsMessengerSchema = {
  [ShortsMessage.APPLY_QUALITY](qualities: QualityFpsPreferences): void;
};

export const shortsMessenger = defineCustomEventMessaging<ShortsMessengerSchema>({
  namespace: "ythd-shorts"
});
