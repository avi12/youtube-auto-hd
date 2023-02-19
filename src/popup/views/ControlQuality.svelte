<script lang="ts">
  import { Storage } from "@plasmohq/storage";

  import Slider from "../components/Slider.svelte";
  import Switch from "../components/Switch.svelte";
  import { fpsSupported, initial, qualities } from "~shared-scripts/ythd-setup";
  import { getI18n } from "~shared-scripts/ythd-utils";
  import type { QualityFpsPreferences, VideoFPS, VideoQuality } from "~types";


  const i18n: { [key: string]: string } = {
    labelSwitchSameQuality: getI18n("cj_i18n_06862", "Use the same quality for all frame rates"),
    labelAllFramerates: getI18n("cj_i18n_06858", "All frame rates"),
    fpsAndBelow: getI18n("cj_i18n_02149", "FPS and below"),
    labelQualityEnd: getI18n("cj_i18n_02148", "FPS videos"),
    fpsWarning: getI18n("cj_i18n_02152", "Videos will play at <= 30 FPS for this quality")
  };

  export let qualitiesStored: QualityFpsPreferences = initial.qualities;
  const qualitiesSelected = Object.values(qualitiesStored).reverse() as VideoQuality[];
  let isSameQualityForAllFps = qualitiesSelected.every((quality, _, array) => quality === array[0]);
  let qualitySelected = qualitiesSelected[0];
  const qualitiesReversed = qualities.reverse();
  const fpsList = fpsSupported.reverse();

  const STORAGE = new Storage({ area: "local" });

  $: {
    if (isSameQualityForAllFps) {
      for (const fps of fpsList) {
        qualitiesStored[fps] = qualitySelected;
      }
    }

    STORAGE.set("qualities", qualitiesStored);
  }

  function fpsToRange(i: number): string {
    const fpsRangeStart: number = fpsList[i - 1] + 1;
    const fps: VideoFPS = fpsList[i];
    return `${fpsRangeStart}-${fps}`;
  }
</script>

<article class="control-section">
  <Switch bind:checked={isSameQualityForAllFps}>
    {i18n.labelSwitchSameQuality}
  </Switch>

  {#if isSameQualityForAllFps}
    <section class="control-section">
      <Slider values={qualitiesReversed} bind:value={qualitySelected}>
        <div class="slider-label">
          <div class="flex-1">{i18n.labelAllFramerates}</div>
          <div class="flex-1 text-secondary">{qualitySelected}p</div>
        </div>
      </Slider>

      {#if qualitySelected < 720}
        <div class="warning mt-4">{i18n.fpsWarning}</div>
      {/if}
    </section>
  {:else}
    {#each fpsList as fps, iFps}
      <section class="control-section">
        <Slider values={qualitiesReversed} bind:value={qualitiesStored[fps]}>
          <div class="slider-label">
            <div class="flex-1">
              {#if iFps === 0}
                {fps} {i18n.fpsAndBelow}
              {:else}
                {fpsToRange(iFps)} {i18n.labelQualityEnd}
              {/if}
            </div>
            <div class="flex-1 text-secondary">{qualitiesStored[fps]}p</div>
          </div>
        </Slider>

        {#if fps > 30 && qualitiesStored[fps] < 720}
          <div class="warning mt-4">{i18n.fpsWarning}</div>
        {/if}
      </section>
    {/each}
  {/if}
</article>

<style lang="scss">
  .slider-label {
    display: flex;
    flex-direction: column;
  }

  .text-secondary {
    color: var(--text-color-secondary);
  }

  .warning {
    background-color: var(--bg-color-warning);
    padding: 10px;
  }
</style>
