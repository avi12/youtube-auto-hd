<script lang="ts">
  import { MaterialApp } from "svelte-materialify";
  import { getI18n } from "../shared-scripts/ythd-utilities";

  import ControlQuality from "./views/ControlQuality.svelte";
  import ControlSize from "./views/ControlSize.svelte";
  import Promotions from "./views/Promotions.svelte";
  import "./views/styles/popup.css";

  export let qualitiesStored;
  export let sizeVideo;
  export let isResizeVideo;

  // Set dark mode
  const instanceDarkMode = matchMedia("(prefers-color-scheme: dark)");
  let theme: "light" | "dark" = instanceDarkMode.matches ? "dark" : "light";
  instanceDarkMode.onchange = ({ matches }) => {
    theme = matches ? "dark" : "light";
  };

  $: document.body.className = theme === "dark" && "theme--dark";

  const isDesktop = !navigator.userAgent.includes("Android");
</script>

<MaterialApp class={getI18n("@@bidi_dir") === "rtl" && "it8n--rtl"} {theme}>
  <ControlQuality {qualitiesStored} />

  {#if isDesktop}
    <ControlSize {isResizeVideo} {sizeVideo} />
  {/if}

  <Promotions />
</MaterialApp>
