import { applyQualityOnMusic } from "./functions-music";
import { MusicMessage, musicMessenger } from "@/lib/music-messaging";

export default defineContentScript({
  matches: ["https://music.youtube.com/*"],
  main() {
    musicMessenger.onMessage(MusicMessage.APPLY_QUAILTY, async ({ data }) => {
      await applyQualityOnMusic(data);
    });
  },
  world: "MAIN"
});
