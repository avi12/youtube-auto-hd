<script>
  import YthdSlider from "./Slider.svelte";

  export let values;
  export let value;
</script>

<slot name="header" />

<YthdSlider {values} bind:value>
  <slot name="label" />
</YthdSlider>

<slot name="footer" />
