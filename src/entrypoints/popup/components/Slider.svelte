<script lang="ts">
  import noUiSlider, { type API } from "nouislider";
  import { onMount } from "svelte";
  import "nouislider/dist/nouislider.css";
  import type { Snippet } from "svelte";
  import type { VideoQuality } from "@/lib/types";

  interface Props {
    values?: Array<VideoQuality>;
    value: VideoQuality;
    children?: Snippet;
  }

  // eslint-disable-next-line prefer-const
  let { values = [], value = $bindable(), children }: Props = $props();

  let index = values.indexOf(value);
  let elSlider = $state<HTMLDivElement>();
  let slider: API;

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
      direction: document.querySelector(".rtl") ? "rtl" : "ltr"
    });
    slider.on("update", pValues => {
      value = pValues[0] as VideoQuality;
      index = values.indexOf(value);
    });
  });
</script>

<div class="slider">
  <div class="label">
    {@render children?.()}
  </div>
  <div bind:this={elSlider} class="slider-element"></div>
</div>

<style>
  .slider {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    & .slider-element.slider-element {
      flex: 1;
      height: 2px;
      background: var(--slider-track-uncover-color);

      /* Overrides for noUiSlider */
      border: none;
      box-shadow: none;

      & :global {
        /*noinspection CssUnusedSymbol*/
        .noUi-connect {
          background: var(--slider-track-cover-color);
        }
      }

      & :global {
        /*noinspection CssUnusedSymbol*/
        .noUi-handle {
          --width: 16px;
          --height: var(--width);
          --top: calc(-1 * var(--height) / 2 + 1px);
          --right: calc(-1 * var(--width) / 2);
          width: var(--width);
          height: var(--height);
          top: var(--top);
          right: var(--right);
          border-radius: 50%;
          background: var(--slider-track-cover-color);

          /* Overrides for noUiSlider */
          border: none;
          box-shadow: none;

          /* Overrides for noUiSlider */

          &::before,
          &::after {
            content: unset;
          }
        }
      }
    }

    /*noinspection CssUnusedSymbol*/

    & .label {
      flex: 1;
    }
  }
</style>
