<script lang="ts">
  import type { Snippet } from "svelte";

  const { label, children }: { label: string; children: Snippet } = $props();
  const headingId = crypto.randomUUID();
</script>

<section aria-labelledby={headingId}>
  <h2 id={headingId} class="group-label">{label}</h2>
  {@render children()}
</section>
