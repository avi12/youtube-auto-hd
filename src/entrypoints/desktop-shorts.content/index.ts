import { changeQualityViaPlayerAPI } from "@/lib/ythd-player-api";
import { ShortsMessage, shortsMessenger } from "@/lib/ythd-shorts-messaging";

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  world: "MAIN",
  main() {
    shortsMessenger.onMessage(ShortsMessage.APPLY_QUALITY, async ({ data }) => {
      await changeQualityViaPlayerAPI(data);
    });
  }
});
