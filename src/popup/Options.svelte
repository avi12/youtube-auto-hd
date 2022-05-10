<script lang="ts">
  import { getI18n } from "../shared-scripts/ythd-utilities";

  import ControlQuality from "./views/ControlQuality.svelte";
  import Promotions from "./views/Promotions.svelte";
  import "./views/styles/popup.css";
  import ControlSize from "./views/ControlSize.svelte";
  import { MaterialApp } from "svelte-materialify";

  export let qualitiesStored;
  export let sizeVideo;
  export let isResizeVideo;

  // Set dark mode
  const instanceDarkMode = matchMedia("(prefers-color-scheme: dark)");
  let theme: "light" | "dark" = instanceDarkMode.matches ? "dark" : "light";
  instanceDarkMode.onchange = ({ matches }) => {
    theme = matches ? "dark" : "light";
  };

  const classNames = [
    getI18n("@@bidi_dir") === "rtl" && "it8n--rtl",
    theme === "dark" && "theme--dark",
  ].join(" ");

  const isDesktop = !navigator.userAgent.includes("Android");
</script>

<MaterialApp class={classNames} {theme}>
  <ControlQuality {qualitiesStored} />

  {#if isDesktop}
    <ControlSize {isResizeVideo} {sizeVideo} />
  {/if}

  <Promotions />
</MaterialApp>
