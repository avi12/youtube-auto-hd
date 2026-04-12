import { changeQualityViaPlayerAPI } from "@/lib/ythd-player-api";
import { embedMessenger, musicMessenger, PlayerMessage, shortsMessenger } from "@/lib/ythd-player-messaging";

export default defineContentScript({
  matches: ["https://www.youtube.com/*", "https://www.youtube-nocookie.com/*", "https://youtube.googleapis.com/*", "https://music.youtube.com/*"],
  allFrames: true,
  world: "MAIN",
  main() {
    embedMessenger.onMessage(PlayerMessage.APPLY_QUALITY, ({ data }) => changeQualityViaPlayerAPI(data));
    shortsMessenger.onMessage(PlayerMessage.APPLY_QUALITY, ({ data }) => changeQualityViaPlayerAPI(data));
    musicMessenger.onMessage(PlayerMessage.APPLY_QUALITY, ({ data }) => changeQualityViaPlayerAPI(data));
  }
});
