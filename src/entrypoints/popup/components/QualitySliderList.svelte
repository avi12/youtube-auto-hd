<script lang="ts">
  import type { Snippet } from "svelte";
  import Slider from "./Slider.svelte";
  import type { VideoQuality } from "@/lib/ythd-types";
  import { fpsList, qualities } from "@/lib/ythd-defaults";
  import { getI18n } from "@/lib/ythd-utils";

  interface Props {
    qualitiesRecord: Record<string, VideoQuality>;
    extra?: Snippet<[string]>;
  }

  const { qualitiesRecord, extra }: Props = $props();

  const i18n = {
    fpsAndBelow: getI18n("cj_i18n_02149", "FPS and below"),
    labelQualityEnd: getI18n("cj_i18n_02148", "FPS videos")
  };

  const qualitiesReversed = [...qualities].reverse();

  function fpsToRange(index: number) {
    const fpsRangeStart = fpsList[index - 1] + 1;
    return `${fpsRangeStart}-${fpsList[index]}`;
  }
</script>

{#each Object.keys(qualitiesRecord) as fps, iFps (fps)}
  {#if iFps > 0}
    <hr class="mt-4" />
  {/if}

  <section>
    <Slider values={qualitiesReversed} bind:value={qualitiesRecord[fps]}>
      <div class="slider-label">
        <div>{qualitiesRecord[fps]}p</div>
        <div class="text-secondary">
          {#if iFps === 0}
            {fps} {i18n.fpsAndBelow}
          {:else}
            {fpsToRange(iFps)} {i18n.labelQualityEnd}
          {/if}
        </div>
      </div>
    </Slider>

    {@render extra?.(fps)}
  </section>
{/each}

<style>
  .slider-label {
    display: flex;
    flex-direction: column;

    & div {
      flex: 1;
    }
  }

  .text-secondary {
    color: var(--text-color-secondary);
    margin-top: 0.5rem;
  }

  /*noinspection CssUnusedSymbol*/
  section :global(.switch) {
    margin-top: 1.25rem;
  }
</style>
