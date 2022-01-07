<script lang="ts">
  import { getI18n } from "../shared-scripts/ythd-utilities";

  import ControlQuality from "./views/ControlQuality.svelte";
  import Promotions from "./views/Promotions.svelte";
  import "./views/styles/popup.css";

  export let qualitiesStored;
</script>

<div class:i18n--rtl={getI18n("@@bidi_dir") === "rtl"}>
  <ControlQuality {qualitiesStored} />

  <Promotions />
</div>
