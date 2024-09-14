<script lang="ts">
  import { Storage } from "@plasmohq/storage";
  import Slider from "../components/Slider.svelte";
  import Switch from "../components/Switch.svelte";
  import { isEnhancedBitrates, qualitiesStored } from "~popup/store";
  import { fpsSupported, qualities } from "~shared-scripts/ythd-setup";
  import { getI18n, IS_DESKTOP } from "~shared-scripts/ythd-utils";
  import type { VideoFPS, VideoQuality } from "~types";

  const i18n: Record<string, string> = {
    labelSwitchSameQuality: getI18n("cj_i18n_06862", "Use the same quality for all frame rates"),
    labelAllFramerates: getI18n("cj_i18n_06858", "All frame rates"),
    fpsAndBelow: getI18n("cj_i18n_02149", "FPS and below"),
    labelQualityEnd: getI18n("cj_i18n_02148", "FPS videos"),
    preferEnhancedBitrate: getI18n("cj_i18n_07392", "Use enhanced bitrate when it's the highest quality"),
    requiresYouTubePremium: getI18n("cj_i18n_07584", "Requires YouTube Premium"),
    fpsWarning: getI18n("cj_i18n_07265", "Videos will play at up to 30 FPS for this quality")
  };

  const fpsList = [...fpsSupported].sort((a, b) => a - b);
  const qualitiesSelected = fpsList.map<VideoQuality>(fps => $qualitiesStored[fps]);
  let isSameQualityForAllFps = qualitiesSelected.every((quality, _, array) => quality === array[0]);
  $: isSameEnhancedBitrateForAllFps = Object.values($isEnhancedBitrates).every(Boolean);

  let qualityForAllSelected = qualitiesSelected[0];

  const qualitiesReversed = [...qualities].reverse();
  const storageLocal = new Storage({ area: "local" });

  $: {
    if (isSameQualityForAllFps) {
      for (const fps in $qualitiesStored) {
        $qualitiesStored[fps] = qualityForAllSelected;
      }
    }

    storageLocal.set("qualities", $qualitiesStored);
  }

  $: {
    storageLocal.set("isEnhancedBitrates", $isEnhancedBitrates);
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
      <Slider values={qualitiesReversed} bind:value={qualityForAllSelected}>
        <div class="slider-label">
          <div>{qualityForAllSelected}p</div>
          <div class="text-secondary">{i18n.labelAllFramerates}</div>
        </div>
      </Slider>

      {#if qualityForAllSelected >= 1080 && IS_DESKTOP}
        <Switch
          on:change={e => {
            fpsList.forEach(fps => {
              $isEnhancedBitrates[fps] = e.detail.checked;
            });
          }}
          checked={isSameEnhancedBitrateForAllFps}
          class="switch">{i18n.preferEnhancedBitrate}</Switch>
        <div class="text-secondary">{i18n.requiresYouTubePremium}</div>
      {/if}

      {#if qualityForAllSelected < 720}
        <div class="warning">{i18n.fpsWarning}</div>
      {/if}
    </section>
  {:else}
    {#each Object.keys($qualitiesStored) as fps, iFps}
      {#if iFps > 0 && IS_DESKTOP}
        <hr class="mt-4" />
      {/if}

      <section class="control-section">
        <Slider values={qualitiesReversed} bind:value={$qualitiesStored[fps]}>
          <div class="slider-label">
            <div>{$qualitiesStored[fps]}p</div>
            <div class="text-secondary">
              {#if iFps === 0}
                {fps} {i18n.fpsAndBelow}
              {:else}
                {fpsToRange(iFps)} {i18n.labelQualityEnd}
              {/if}
            </div>
          </div>
        </Slider>

        {#if $qualitiesStored[fps] >= 1080 && IS_DESKTOP}
          <Switch
            on:change={e => ($isEnhancedBitrates[fps] = e.detail.checked)}
            checked={$isEnhancedBitrates[fps]}
            class="switch">{i18n.preferEnhancedBitrate}</Switch>
          <div class="text-secondary">{i18n.requiresYouTubePremium}</div>
        {/if}

        {#if $qualitiesStored[fps] < 720 && +fps > 30}
          <div class="warning">{i18n.fpsWarning}</div>
        {/if}
      </section>
    {/each}
  {/if}
</article>

<hr class="mt-4" />

<style>
  .control-section {
    & .switch {
      margin-top: 1.25rem;
    }
  }

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

  .warning {
    background-color: var(--bg-color-warning);
    padding: 10px;
    margin-top: 1rem;
  }
</style>
