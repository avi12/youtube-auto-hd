<script lang="ts">
  interface Props {
    path?: string;
  }

  const { path = "" }: Props = $props();
  const d = path;

  const SIZE = 24;
</script>

<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE}px" height="{SIZE}px">
  <path {d} />
</svg>

<style>
  svg {
    margin-inline-end: 10px;
  }

  path {
    fill: currentColor;
  }
</style>
