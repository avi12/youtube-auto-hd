<script>
  import { Icon, Radio, Tooltip } from "svelte-materialify";
  import { getI18n } from "../yt-auto-hd-utilities";
  import { mdiHelpCircle } from "@mdi/js";

  export let qualityFallback;

  $: {
    // noinspection JSUnusedAssignment
    chrome.storage.local.set({ qualityFallback });
  }
</script>

<div class="subheader">{getI18n('', 'Fallback quality')}</div>
{getI18n('', 'When the chosen quality is missing, select:')}
<Tooltip top>
  <Icon path={mdiHelpCircle} />
  <span
    slot="tip">{getI18n('', 'E.g. Available qualities are 1080p, 480p, 360p but you choose 720p')}</span>
</Tooltip>

<div class="d-flex flex-column flex-gap mt-1">
  <Radio bind:group={qualityFallback} value="best">
    {getI18n('', 'Next best quality')}
  </Radio>
  <Radio bind:group={qualityFallback} value="worse">
    {getI18n('', 'Next worse quality')}
  </Radio>
</div>

<style>
  .flex-gap {
    gap: 7px;
  }
</style>
