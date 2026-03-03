import { defineCustomEventMessaging } from "@webext-core/messaging/page";
import type { QualityFpsPreferences } from "./types";

export enum MusicMessage {
  APPLY_QUAILTY = "applyQuality"
}

type MusicMessengerSchema = {
  [MusicMessage.APPLY_QUAILTY](qualities: QualityFpsPreferences): void;
};

export const musicMessenger = defineCustomEventMessaging<MusicMessengerSchema>({
  namespace: "ythd-music"
});
