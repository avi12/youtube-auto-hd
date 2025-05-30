<script lang="ts">
  import PromotionLinks from "@/entrypoints/popup/components/PromotionLinks.svelte";
  import { isHideDonationSection } from "@/entrypoints/popup/states.svelte";
  import { getI18n } from "@/lib/ythd-utils";

  const i18n: Record<string, string> = {
    labelSubheader: getI18n("cj_i18n_06860", "Support developer")
  };
</script>

{#if isHideDonationSection.value}
  <details class="promotion-section">
    <summary class="summary">
      <span>{i18n.labelSubheader}</span>
    </summary>
    <PromotionLinks />
  </details>
{:else}
  <footer class="promotion-section">
    <div>{i18n.labelSubheader}</div>
    <PromotionLinks />
  </footer>
{/if}

<style>
  .promotion-section {
    margin-top: 1.25rem;

    & .summary {
      margin-bottom: 0.25rem;
      margin-inline-start: 0.45rem;
      color: var(--text-color-secondary);
      cursor: pointer;

      & span {
        margin-inline-start: 1rem;
      }
    }
  }
</style>
