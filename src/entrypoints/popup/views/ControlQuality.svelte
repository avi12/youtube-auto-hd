<script lang="ts">
  import { storage } from "#imports";
  import Slider from "../components/Slider.svelte";
  import Switch from "../components/Switch.svelte";
  import { isEnhancedBitrates, isUseSuperResolution, qualitiesStored } from "@/entrypoints/popup/states.svelte";
  import type { VideoFPS, VideoQuality } from "@/lib/types";
  import { fpsSupported, qualities } from "@/lib/ythd-setup";
  import {getI18n, getUncircularJson} from "@/lib/ythd-utils";

  const i18n: Record<string, string> = {
    labelSwitchSameQuality: getI18n("cj_i18n_06862", "Use the same quality for all frame rates"),
    labelAllFramerates: getI18n("cj_i18n_06858", "All frame rates"),
    fpsAndBelow: getI18n("cj_i18n_02149", "FPS and below"),
    labelQualityEnd: getI18n("cj_i18n_02148", "FPS videos"),
    preferEnhancedBitrate: getI18n("cj_i18n_07392", "Use enhanced bitrate when it's the highest quality"),
    requiresYouTubePremium: getI18n("cj_i18n_07584", "Requires YouTube Premium"),
    fpsWarning: getI18n("cj_i18n_07265", "Videos will play at up to 30 FPS for this quality"),
    labelUseSuperResolution: getI18n("cj_i18n_07966", "Use super resolution when available")
  };

  const fpsList = [...fpsSupported].sort((a, b) => a - b);
  const qualitiesSelected = fpsList.map<VideoQuality>(fps => qualitiesStored.value?.[fps] ?? qualities[0]);
  let isSameQualityForAllFps = $state(new Set(qualitiesSelected).size === 1);
  const isSameEnhancedBitrateForAllFps = $derived(Object.values(isEnhancedBitrates.value ?? {}).every(Boolean));

  let qualityForAllSelected = $state(qualitiesSelected[0]);

  const qualitiesReversed = [...qualities].reverse();

  const isEnablePerFpsEnhancedBitrateToggle = false;

  $effect(() => {
    if (!isSameQualityForAllFps || qualitiesStored.value === null) {
      return;
    }
    for (const fps of fpsList) {
      qualitiesStored.value[fps] = qualityForAllSelected;
    }
  });

  $effect(() => {
    storage.setItem("local:qualities", getUncircularJson(qualitiesStored.value));
  });

  $effect(() => {
    storage.setItem("local:isEnhancedBitrates", getUncircularJson(isEnhancedBitrates.value));
  });

  $effect(() => {
    storage.setItem("local:isUseSuperResolution", isUseSuperResolution.value);
  });

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

  {#if qualitiesStored.value !== null}
    {#if isSameQualityForAllFps}
      <section class="control-section">
        <Slider values={qualitiesReversed} bind:value={qualityForAllSelected}>
          <div class="slider-label">
            <div>{qualityForAllSelected}p</div>
            <div class="text-secondary">{i18n.labelAllFramerates}</div>
          </div>
        </Slider>

        {#if isEnablePerFpsEnhancedBitrateToggle && qualityForAllSelected >= 1080}
          {@render toggleEnhancedBitrateForAllFps()}
        {/if}

        {#if qualityForAllSelected < 720}
          <div class="warning">{i18n.fpsWarning}</div>
        {/if}
      </section>
    {:else}
      {#each Object.keys(qualitiesStored.value) as fps, iFps (fps)}
        {#if iFps > 0}
          <hr />
        {/if}

        <section class="control-section">
          <Slider values={qualitiesReversed} bind:value={qualitiesStored.value[fps]}>
            <div class="slider-label">
              <div>{qualitiesStored.value[fps]}p</div>
              <div class="text-secondary">
                {#if iFps === 0}
                  {fps} {i18n.fpsAndBelow}
                {:else}
                  {fpsToRange(iFps)} {i18n.labelQualityEnd}
                {/if}
              </div>
            </div>
          </Slider>

          {#if isEnablePerFpsEnhancedBitrateToggle && qualitiesStored.value[fps] >= 1080}
            <Switch
              change={isEnableEnhancedBitRate => {
                if (isEnhancedBitrates.value) {
                  isEnhancedBitrates.value[fps] = isEnableEnhancedBitRate;
                }
              }}
              checked={isEnhancedBitrates.value?.[fps]}
              className="switch">{i18n.preferEnhancedBitrate}</Switch>
            <div class="text-secondary">{i18n.requiresYouTubePremium}</div>
          {/if}

          {#if qualitiesStored.value[fps] < 720 && +fps > 30}
            <div class="warning">{i18n.fpsWarning}</div>
          {/if}
        </section>
      {/each}
    {/if}
  {/if}

  {#if !isEnablePerFpsEnhancedBitrateToggle}
    {@render toggleEnhancedBitrateForAllFps()}
  {/if}
</article>

<hr />

<Switch bind:checked={isUseSuperResolution.value} style="margin-block: 1.25rem;">
  {i18n.labelUseSuperResolution}
</Switch>

<hr />

{#snippet toggleEnhancedBitrateForAllFps()}
  <Switch
    change={isEnableEnhancedBitRate => {
      fpsList.forEach(fps => {
        if (isEnhancedBitrates.value) {
          isEnhancedBitrates.value[fps] = isEnableEnhancedBitRate;
        }
      });
    }}
    checked={isSameEnhancedBitrateForAllFps}
    className="switch">{i18n.preferEnhancedBitrate}</Switch>
  <div class="text-secondary">{i18n.requiresYouTubePremium}</div>
{/snippet}

<style>
  .control-section {
    /*noinspection CssUnusedSymbol*/
    & :global(.switch) {
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
