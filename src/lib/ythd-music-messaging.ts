import type { QualityFpsPreferences } from "./ythd-types";
import { defineCustomEventMessaging } from "@webext-core/messaging/page";

export enum MusicMessage {
  APPLY_QUAILTY = "applyQuality"
}

type MusicMessengerSchema = {
  [MusicMessage.APPLY_QUAILTY](qualities: QualityFpsPreferences): void;
};

export const musicMessenger = defineCustomEventMessaging<MusicMessengerSchema>({
  namespace: "ythd-music"
});
