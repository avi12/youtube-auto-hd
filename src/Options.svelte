<script>
  import { getI18n } from "./yt-auto-hd-utilities";

  import ControlQuality from "./views/ControlQuality.svelte";
  import ControlQualityFallback from "./views/ControlQualityFallback.svelte";
  import Promotions from "./views/Promotions.svelte";
  import ControlSize from "./views/ControlSize.svelte";
  import "./views/styles/popup.css";

  export let qualitiesStored;
  export let qualityFallback;
  export let sizeVideo;
  export let isResizeVideo;
</script>

<div class:i18n--rtl={getI18n('@@bidi_dir') === 'rtl'}>
  <ControlQuality {qualitiesStored} />

  <div class="mt-3">
    <ControlQualityFallback {qualityFallback} />
  </div>

  <div class="mt-6">
    <ControlSize {isResizeVideo} {sizeVideo} />
  </div>

  <div class="mt-3">
    <Promotions />
  </div>
</div>