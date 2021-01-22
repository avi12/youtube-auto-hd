<script>
  import { Icon, Radio, Tooltip } from "svelte-materialify";
  import { getI18n } from "../yt-auto-hd-utilities";
  import { mdiHelpCircle } from "@mdi/js";

  export let qualityFallback;

  const i18n = {
    labelSubheader: getI18n("", "Fallback quality"),
    labelInstruction: getI18n(
      "",
      "When the chosen quality is missing, select:"
    ),
    labelTooltip: getI18n(
      "",
      "E.g. Available qualities are 1080p, 480p, 360p but you choose 720p"
    ),
    labelOptionHigher: getI18n("", "Next higher quality"),
    labelOptionLower: getI18n("", "Next lower quality")
  };

  $: {
    // noinspection JSUnusedAssignment
    chrome.storage.local.set({ qualityFallback });
  }
</script>

<div class="subheader mb-1">{i18n.labelSubheader}</div>
{i18n.labelInstruction}
<Tooltip top>
  <Icon path={mdiHelpCircle} />
  <span slot="tip">{i18n.labelTooltip}</span>
</Tooltip>

<div class="d-flex flex-column flex-gap mt-1">
  <Radio bind:group={qualityFallback} value="higher">
    {i18n.labelOptionHigher}
  </Radio>
  <Radio bind:group={qualityFallback} value="lower">
    {i18n.labelOptionLower}
  </Radio>
</div>

<style>
  .flex-gap {
    gap: 7px;
  }
</style>
