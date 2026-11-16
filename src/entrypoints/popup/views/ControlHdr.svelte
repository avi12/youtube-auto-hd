<script lang="ts">
  import Switch from "@/entrypoints/popup/components/Switch.svelte";
  import { isForceSdr, isLimitHdrBrightness } from "@/entrypoints/popup/states.svelte";
  import { getI18n } from "@/lib/ythd-utils";
  import { storage } from "#imports";

  const i18n = {
    labelLimitHdrBrightness: getI18n("cj_i18n_08032", "Limit HDR brightness"),
    descriptionLimitHdrBrightness: getI18n(
      "cj_i18n_08033",
      "Limits HDR highlights to SDR brightness without lowering resolution, rather than downloading SDR."
    ),
    labelForceSdr: getI18n("cj_i18n_08034", "Force SDR"),
    descriptionForceSdr: getI18n(
      "cj_i18n_08035",
      "Requests SDR video instead of HDR. Reload YouTube after changing this option or the extension’s master switch."
    )
  };

  $effect(() => {
    if (isLimitHdrBrightness.value === null) {
      return;
    }

    void storage.setItem("local:isLimitHdrBrightness", isLimitHdrBrightness.value);
  });

  $effect(() => {
    if (isForceSdr.value === null) {
      return;
    }

    void storage.setItem("local:isForceSdr", isForceSdr.value);
  });
</script>

<article class="control-section">
  <Switch bind:checked={isLimitHdrBrightness.value}>{i18n.labelLimitHdrBrightness}</Switch>
  <div class="text-secondary">{i18n.descriptionLimitHdrBrightness}</div>
</article>

<article class="control-section">
  <Switch bind:checked={isForceSdr.value}>{i18n.labelForceSdr}</Switch>
  <div class="text-secondary">{i18n.descriptionForceSdr}</div>
</article>

<hr class="section-divider" />

<style>
  .text-secondary {
    margin-top: 0.5rem;
    color: var(--text-color-secondary);
  }

  .section-divider {
    margin-top: 1.25rem;
  }
</style>
