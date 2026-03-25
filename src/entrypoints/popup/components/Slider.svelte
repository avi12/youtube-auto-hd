<script lang="ts">
  import noUiSlider, { type API } from "nouislider";
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import "nouislider/dist/nouislider.css";
  import type { VideoQuality } from "@/lib/ythd-types";

  interface Props {
    values?: Array<VideoQuality>;
    value: VideoQuality;
    children?: Snippet;
  }


  let { values = [], value = $bindable(), children }: Props = $props();

  const index = $derived(values.indexOf(value));
  let elSlider = $state<HTMLDivElement>();
  let slider: API;
  const labelId = crypto.randomUUID();

  onMount(() => {
    slider = noUiSlider.create(elSlider!, {
      start: values[0],
      connect: [true, false],
      format: {
        from: () => index,
        to: i => values[i]
      },
      range: {
        min: 0,
        max: values.length - 1
      },
      step: 1,
      direction: document.querySelector("[dir='rtl']") ? "rtl" : "ltr"
    });
    elSlider!.querySelector(".noUi-handle")?.setAttribute("aria-labelledby", labelId);
    slider.on("update", (_, __, unencoded) => {
      value = values[Math.round(unencoded[0])];
    });
  });
</script>

<div class="slider">
  <div class="label" id={labelId}>
    {@render children?.()}
  </div>
  <div bind:this={elSlider} class="slider-element"></div>
</div>

<style>
  .slider {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    & .slider-element.slider-element {
      flex: 1;
      height: 2px;

      /* Overrides for noUiSlider */
      border: none;
      background: var(--slider-track-uncover-color);
      box-shadow: none;

      /* noinspection CssUnusedSymbol */

      & :global(.noUi-connect) {
        background: var(--slider-track-cover-color);
      }

      /* noinspection CssUnusedSymbol */

      & :global(.noUi-handle) {
        --width: 16px;
        --height: var(--width);
        --top: calc(-1 * var(--height) / 2 + 1px);
        --right: calc(-1 * var(--width) / 2);

        top: var(--top);
        right: var(--right);
        width: var(--width);
        height: var(--height);

        /* Overrides for noUiSlider */
        border: none;
        border-radius: 50%;
        background: var(--slider-track-cover-color);
        box-shadow: none;
      }

      /* noinspection CssUnusedSymbol */

      & :global(.noUi-handle::before),
      & :global(.noUi-handle::after) {
        content: none;
      }
    }

    & .label {
      flex: 1;
    }
  }
</style>
