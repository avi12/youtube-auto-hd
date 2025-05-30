<script lang="ts">
  import { storage } from "#imports";
  import Switch from "@/entrypoints/popup/components/Switch.svelte";
  import { isExtensionEnabled } from "@/entrypoints/popup/states.svelte";
  import { getI18n } from "@/lib/ythd-utils";

  const i18n: Record<string, string> = {
    labelEnabled: getI18n("cj_i18n_07266", "Extension is on")
  };

  $effect(() => {
    storage.setItem("local:isExtensionEnabled", isExtensionEnabled.value);
  });
</script>

<Switch bind:checked={isExtensionEnabled.value}>{i18n.labelEnabled}</Switch>
