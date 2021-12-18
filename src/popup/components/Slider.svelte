<script lang="ts">
  import { Slider } from "svelte-materialify";
  import type { VideoQuality } from "../../types";

  export let label: string;
  export let values = [] as VideoQuality[];
  export let value: VideoQuality;

  const iValue = values.indexOf(value);

  function onInput(e): void {
    value = values.find((_, i) => i === Number(e.detail.value[0]));
  }

  function getThumb(iValue): string {
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
/*noinspection CssUnusedSymbol*/
:global(.s-slider__tooltip::before) {
  --size: 38px;

  width: var(--size, 38px) !important;
  height: var(--size, 38px) !important;
  background: #f44336 !important;
}
</style>
