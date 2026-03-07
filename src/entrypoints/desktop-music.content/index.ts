import { MusicMessage, musicMessenger } from "@/lib/ythd-music-messaging";
import { changeQualityViaPlayerAPI } from "@/lib/ythd-player-api";

export default defineContentScript({
  matches: ["https://music.youtube.com/*"],
  main() {
    musicMessenger.onMessage(MusicMessage.APPLY_QUAILTY, async ({ data }) => {
      await changeQualityViaPlayerAPI(data);
    });
  },
  world: "MAIN"
});
