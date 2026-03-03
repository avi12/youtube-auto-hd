<script lang="ts">
  import { storage } from "#imports";
  import Slider from "../components/Slider.svelte";
  import Switch from "../components/Switch.svelte";
  import {
    isEnableYouTubeMusic,
    isSameQualityMusicAsYouTube,
    qualitiesMusicStored,
    qualitiesStored
  } from "@/entrypoints/popup/states.svelte";
  import type { VideoFPS } from "@/lib/types";
  import { fpsSupported, qualities } from "@/lib/ythd-setup";
  import { getI18n, getUncircularJson } from "@/lib/ythd-utils";

  const i18n = {
    labelEnableYouTubeMusic: getI18n("cj_i18n_todo", "Run on YouTube Music"),
    labelSameQuality: getI18n("cj_i18n_todo", "Same quality configuration as above"),
    fpsAndBelow: getI18n("cj_i18n_02149", "FPS and below"),
    labelQualityEnd: getI18n("cj_i18n_02148", "FPS videos")
  };

  const fpsList = [...fpsSupported].sort((a, b) => a - b);
  const qualitiesReversed = [...qualities].reverse();

  $effect(() => {
    if (!isSameQualityMusicAsYouTube.value || !qualitiesStored.value || !qualitiesMusicStored.value) {
      return;
    }
    for (const fps of fpsList) {
      qualitiesMusicStored.value[fps] = qualitiesStored.value[fps];
    }
  });

  $effect(() => {
    if (qualitiesMusicStored.value === null) {
      return;
    }
    storage.setItem("local:qualitiesMusic", getUncircularJson(qualitiesMusicStored.value));
  });

  $effect(() => {
    if (isSameQualityMusicAsYouTube.value === null) {
      return;
    }
    storage.setItem("local:isSameQualityMusicAsYouTube", isSameQualityMusicAsYouTube.value);
  });

  $effect(() => {
    if (isEnableYouTubeMusic.value === null) {
      return;
    }
    storage.setItem("local:isEnableYouTubeMusic", isEnableYouTubeMusic.value);
  });

  function fpsToRange(i: number): string {
    const fpsRangeStart: number = fpsList[i - 1] + 1;
    const fps: VideoFPS = fpsList[i];
    return `${fpsRangeStart}-${fps}`;
  }
</script>

<Switch bind:checked={isEnableYouTubeMusic.value} style="margin-block: 1.25rem;">
  {i18n.labelEnableYouTubeMusic}
</Switch>

{#if isEnableYouTubeMusic.value}
  <Switch bind:checked={isSameQualityMusicAsYouTube.value}>
    {i18n.labelSameQuality}
  </Switch>

  {#if !isSameQualityMusicAsYouTube.value && qualitiesMusicStored.value !== null}
    <article class="control-section">
      {#each Object.keys(qualitiesMusicStored.value) as fps, iFps (fps)}
        {#if iFps > 0}
          <hr class="mt-4" />
        {/if}

        <section class="control-section">
          <Slider values={qualitiesReversed} bind:value={qualitiesMusicStored.value[fps]}>
            <div class="slider-label">
              <div>{qualitiesMusicStored.value[fps]}p</div>
              <div class="text-secondary">
                {#if iFps === 0}
                  {fps} {i18n.fpsAndBelow}
                {:else}
                  {fpsToRange(iFps)} {i18n.labelQualityEnd}
                {/if}
              </div>
            </div>
          </Slider>
        </section>
      {/each}
    </article>
  {/if}
{/if}

<hr />

<style>
  .control-section {
    margin-top: 20px;
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
</style>
