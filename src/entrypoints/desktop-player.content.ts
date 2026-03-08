import { changeQualityViaPlayerAPI } from "@/lib/ythd-player-api";
import { musicMessenger, PlayerMessage, shortsMessenger } from "@/lib/ythd-player-messaging";

export default defineContentScript({
  matches: ["https://www.youtube.com/*", "https://music.youtube.com/*"],
  world: "MAIN",
  main() {
    shortsMessenger.onMessage(PlayerMessage.APPLY_QUALITY, ({ data }) => changeQualityViaPlayerAPI(data));
    musicMessenger.onMessage(PlayerMessage.APPLY_QUALITY, ({ data }) => changeQualityViaPlayerAPI(data));
  }
});
