<script>
  import { Switch } from "svelte-materialify";
  import { qualities } from "../yt-auto-hd-setup";
  import { getI18n } from "../yt-auto-hd-utilities";
  import SliderYthd from "../components/Slider.svelte";

  // prettier-ignore
  const i18n = {
    labelQualityHeader: getI18n("cj_i18n_02147", "View quality"),
    labelSwitchSameQuality: getI18n("cj_i18n_06862", "Use the same quality for all frame rates"),
    labelAllFramerates: getI18n("cj_i18n_06858", "All frame rates"),
    fpsAndBelow: getI18n("cj_i18n_02149", "FPS and below"),
    labelQualityEnd: getI18n("cj_i18n_02148", "FPS videos"),
    fpsWarning: getI18n("cj_i18n_02152", "Videos will play at 30 FPS for this quality.")
  };

  export let qualitiesStored = {};

  let qualitiesSelected = Object.values(qualitiesStored).reverse();

  let isSameQualityForAllFps = qualitiesSelected.every(
    (quality, _, array) => quality === array[0]
  );

  let qualitySelected = qualitiesSelected[0];

  const qualitiesReversed = qualities.reverse();
  const fpsList = [30, 50, 60];

  $: {
    if (isSameQualityForAllFps) {
      for (const fps of fpsList) {
        qualitiesStored[fps] = qualitySelected;
      }
    }

    chrome.storage.local.set({ qualities: qualitiesStored });
  }

  function fpsToRange(i) {
    const fpsRangeStart = fpsList[i - 1] + 1;
    const fps = fpsList[i];
    return `${fpsRangeStart}-${fps}`;
  }
</script>

<div class="subheader">{i18n.labelQualityHeader}</div>

<Switch bind:checked={isSameQualityForAllFps} color="red">
  {i18n.labelSwitchSameQuality}
</Switch>

{#if isSameQualityForAllFps}
  {i18n.labelAllFramerates}
  <SliderYthd values={qualitiesReversed} bind:value={qualitySelected}>
    {qualitySelected}p
  </SliderYthd>
{:else}
  {#each fpsList as fps, iFps}
    <!-- prettier-ignore -->
    {#if iFps === 0}
      {fps} {i18n.fpsAndBelow}
    {:else}
      {fpsToRange(iFps)} {i18n.labelQualityEnd}
    {/if}

    <SliderYthd
      values={qualitiesReversed}
      bind:value={qualitiesStored[fps]}>
      {qualitiesStored[fps]}p
    </SliderYthd>

    {#if fps > 30 && qualitiesStored[fps] < 720}
      <div class="red-text mb-4">{i18n.fpsWarning}</div>
    {/if}
  {/each}
{/if}
