<script lang="ts">
  import type { Snippet } from "svelte";

  const { label, children }: { label: string; children: Snippet } = $props();
</script>

<h2 class="group-label">{label}</h2>
{@render children()}
