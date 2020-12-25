<script>
  import { Slider } from "svelte-materialify";

  export let label;
  export let values = [];
  export let value = [];

  let iValue = values.indexOf(value);

  function onInput(e) {
    value = values.find((_, i) => i === e.detail.value[0]);
  }
  function getThumb(iValue) {
    const qualityNumber = values[iValue];
    return `${qualityNumber}p`;
  }
</script>

<Slider
  color="red"
  max={values.length - 1}
  min={0}
  on:update={onInput}
  step={1}
  thumb={getThumb}
  value={iValue}>
  <slot>{label}</slot>
</Slider>

<style>
  :global(.s-slider__tooltip::before) {
    --size: 38px;
    width: var(--size) !important;
    height: var(--size) !important;
    background: #f44336 !important;
  }
</style>
