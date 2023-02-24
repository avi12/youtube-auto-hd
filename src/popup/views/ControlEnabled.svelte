<script lang="ts">
  import { Storage } from "@plasmohq/storage";

  import Switch from "~popup/components/Switch.svelte";
  import { isExtensionEnabled } from "~popup/store";
  import { getI18n } from "~shared-scripts/ythd-utils";

  const storage = new Storage({ area: "local" });

  const i18n: { [key: string]: string } = {
    labelEnabled: getI18n("cj_i18n_07266", "Extension is on")
  };

  $: {
    storage.set("isExtensionEnabled", $isExtensionEnabled);
  }
</script>

<article class="control-section">
  <Switch bind:checked={$isExtensionEnabled}>{i18n.labelEnabled}</Switch>
</article>
