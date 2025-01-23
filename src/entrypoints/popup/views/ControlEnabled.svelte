<script lang="ts">
  import { storage } from "wxt/storage";
  import Switch from "@/entrypoints/popup/components/Switch.svelte";
  import { isExtensionEnabled } from "@/entrypoints/popup/store";
  import { getI18n } from "@/lib/ythd-utils";

  const i18n: Record<string, string> = {
    labelEnabled: getI18n("cj_i18n_07266", "Extension is on")
  };

  $effect(() => {
    storage.setItem("local:isExtensionEnabled", $isExtensionEnabled);
  });
</script>

<Switch bind:checked={$isExtensionEnabled}>{i18n.labelEnabled}</Switch>
