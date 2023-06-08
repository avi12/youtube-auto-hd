<script lang="ts">
  import PromotionLinks from "~popup/components/PromotionLinks.svelte";
  import { isDonated } from "~popup/store";
  import { getI18n } from "~shared-scripts/ythd-utils";

  const i18n: { [key: string]: string } = {
    labelSubheader: getI18n("cj_i18n_06860", "Support developer")
  };
</script>

<hr class="mt-6" />

{#if $isDonated}
  <details class="mt-5">
    <summary class="mb-1 ms-[0.45rem] text-secondary cursor-pointer">
      <span class="ms-4">{i18n.labelSubheader}</span>
    </summary>
    <PromotionLinks />
  </details>
{:else}
  <footer class="mt-5">
    <div>{i18n.labelSubheader}</div>
    <PromotionLinks />
  </footer>
{/if}

<style lang="scss">
  .text-secondary {
    color: var(--text-color-secondary);
  }
</style>
