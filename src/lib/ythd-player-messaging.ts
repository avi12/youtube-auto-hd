import type { QualityFpsPreferences } from "./ythd-types";
import { defineCustomEventMessaging } from "@webext-core/messaging/page";

export enum PlayerMessage {
  APPLY_QUALITY = "applyQuality"
}

type PlayerMessengerSchema = {
  [PlayerMessage.APPLY_QUALITY](qualities: QualityFpsPreferences): void;
};

function createPlayerMessenger(namespace: string) {
  return defineCustomEventMessaging<PlayerMessengerSchema>({ namespace });
}

export const embedMessenger = createPlayerMessenger("ythd-embed");
export const musicMessenger = createPlayerMessenger("ythd-music");
export const shortsMessenger = createPlayerMessenger("ythd-shorts");
