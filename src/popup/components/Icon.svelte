<script lang="ts">
  export let path = "";
  const d = path;

  const SIZE = 24;
</script>

<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE}px" height="{SIZE}px">
  <path {d} />
</svg>

<style lang="scss">
  svg {
    margin-inline-end: 10px;
  }

  path {
    fill: currentColor;
  }
</style>
