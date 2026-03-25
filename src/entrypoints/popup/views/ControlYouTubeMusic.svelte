<script lang="ts">
  import { storage } from "#imports";
  import QualitySliderList from "../components/QualitySliderList.svelte";
  import Switch from "../components/Switch.svelte";
  import {
    isEnableYouTubeMusic,
    isUseGlobalQualityPreferences,
    qualitiesMusicStored,
    qualitiesStored
  } from "@/entrypoints/popup/states.svelte";
  import { fpsList } from "@/lib/ythd-defaults";
  import { getI18n, getUncircularJson } from "@/lib/ythd-utils";

  const i18n = {
    labelEnableYouTubeMusic: getI18n("cj_i18n_todo", "Run on YouTube Music"),
    labelSameQuality: getI18n("cj_i18n_08030", "Use global quality preferences")
  };

  $effect(() => {
    if (!isUseGlobalQualityPreferences.value || !qualitiesStored.value || !qualitiesMusicStored.value) {
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

  let isEnableInitialized = false;
  $effect(() => {
    const value = isEnableYouTubeMusic.value;
    if (isEnableInitialized && value !== null) {
      storage.setItem("local:isEnableYouTubeMusic", value);
    }
    isEnableInitialized = true;
  });

  let isSameQualityInitialized = false;
  $effect(() => {
    const value = isUseGlobalQualityPreferences.value;
    if (isSameQualityInitialized && value !== null) {
      storage.setItem("local:isUseGlobalQualityPreferences", value);
    }
    isSameQualityInitialized = true;
  });
</script>

<article class="control-section">
  <Switch bind:checked={isEnableYouTubeMusic.value}>
    {i18n.labelEnableYouTubeMusic}
  </Switch>

  {#if isEnableYouTubeMusic.value}
    <Switch bind:checked={isUseGlobalQualityPreferences.value} className="switch">
      {i18n.labelSameQuality}
    </Switch>

    {#if !isUseGlobalQualityPreferences.value && qualitiesMusicStored.value !== null}
      <div class="music-quality">
        <QualitySliderList qualitiesRecord={qualitiesMusicStored.value} />
      </div>
    {/if}
  {/if}
</article>

<hr />

<style>
  .control-section {
    /* noinspection CssUnusedSymbol */

    & :global(.switch) {
      margin-top: 1.25rem;
    }
  }

  .music-quality {
    margin-top: 1.25rem;
  }
</style>
