<script type="ts">
  import { Button, MaterialAppMin } from "svelte-materialify";
  import { permissions } from "./permission-utils";

  function askForPermissions() {
    chrome.permissions.request(permissions, pIsGranted => isGranted = pIsGranted);
  }

  let isGranted;

  const instanceDarkMode = matchMedia("(prefers-color-scheme: dark)");
  let theme: "light" | "dark" = instanceDarkMode.matches ? "dark" : "light";
  instanceDarkMode.onchange = e => {
    theme = e.matches ? "dark" : "light";
  };
</script>

<MaterialAppMin {theme}>
  <div class="text-center pt-10">
    <h1 class="text-h2 mb-3">Permissions</h1>
    <p class="text-h6">YouTube Auto HD + FPS requires certain permissions to work properly.</p>
    <Button on:click={askForPermissions} outlined={theme === "dark"}>Grant permissions</Button>
    {#if isGranted}
      <p class="text-h6 mt-3 success-text">Permissions granted! Now reload any open YouTube pages</p>
    {:else if isGranted === false}
      <p class="text-h6 mt-3 red-text">Permissions not granted!</p>
    {/if}
  </div>
</MaterialAppMin>
