import { initial } from "@/lib/ythd-defaults";
import "@/lib/ythd-hdr.css";
import { storage } from "#imports";

export default defineContentScript({
  matches: ["https://*.youtube.com/*", "https://www.youtube-nocookie.com/*", "https://youtube.googleapis.com/*"],
  allFrames: true,
  runAt: "document_start",
  async main(ctx) {
    let isExtensionEnabled: boolean | undefined;
    let isLimitHdrBrightness: boolean | undefined;

    function applyBrightnessLimit() {
      document.documentElement?.toggleAttribute(
        "data-ythd-limit-hdr",
        (isExtensionEnabled ?? initial.isExtensionEnabled)
        && (isLimitHdrBrightness ?? initial.isLimitHdrBrightness)
      );
    }

    const unwatchExtension = storage.watch<boolean>("local:isExtensionEnabled", isEnabled => {
      isExtensionEnabled = isEnabled ?? initial.isExtensionEnabled;
      applyBrightnessLimit();
    });
    const unwatchBrightness = storage.watch<boolean>("local:isLimitHdrBrightness", isEnabled => {
      isLimitHdrBrightness = isEnabled ?? initial.isLimitHdrBrightness;
      applyBrightnessLimit();
    });
    ctx.addEventListener(document, "DOMContentLoaded", applyBrightnessLimit, { once: true });
    ctx.onInvalidated(() => {
      unwatchExtension();
      unwatchBrightness();
      document.documentElement?.removeAttribute("data-ythd-limit-hdr");
    });

    const [isExtensionStored, isBrightnessStored] = await Promise.all([
      storage.getItem<boolean>("local:isExtensionEnabled", { fallback: initial.isExtensionEnabled }),
      storage.getItem<boolean>("local:isLimitHdrBrightness", { fallback: initial.isLimitHdrBrightness })
    ]);
    if (ctx.isInvalid) {
      return;
    }

    // Keep changes received while the initial storage read was pending.
    isExtensionEnabled ??= isExtensionStored;
    isLimitHdrBrightness ??= isBrightnessStored;
    applyBrightnessLimit();
  }
});
