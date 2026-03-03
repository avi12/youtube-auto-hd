<script lang="ts">
  import { storage } from "#imports";
  import QualitySliderList from "../components/QualitySliderList.svelte";
  import Switch from "../components/Switch.svelte";
  import {
    isEnableYouTubeMusic,
    isSameQualityMusicAsYouTube,
    qualitiesMusicStored,
    qualitiesStored
  } from "@/entrypoints/popup/states.svelte";
  import { fpsList } from "@/lib/ythd-setup";
  import { getI18n, getUncircularJson } from "@/lib/ythd-utils";

  const i18n = {
    labelEnableYouTubeMusic: getI18n("cj_i18n_todo", "Run on YouTube Music"),
    labelSameQuality: getI18n("cj_i18n_todo", "Same quality configuration as above")
  };

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
      <QualitySliderList qualitiesRecord={qualitiesMusicStored.value} />
    </article>
  {/if}
{/if}

<hr />

<style>
  .control-section {
    margin-top: 20px;
  }
</style>
