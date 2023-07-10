<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let checked = false;

  const dispatch = createEventDispatcher();
</script>

<label {...$$restProps}>
  <input bind:checked on:change={e => dispatch("change", { checked: e.currentTarget.checked })} role="switch" type="checkbox"/>
  <slot/>
</label>

<style lang="scss">
  label {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 21px;
    justify-content: space-between;
    cursor: pointer;
  }

  // https://www.youtube.com/watch?v=_KqccADghcA
  [role="switch"] {
    --thumb-position: 0%;
    --isLTR: 1;
    $width: 2rem;
    $thumb-width: 1rem;
    $height: 1rem;

    padding: 2px;
    background-color: var(--switch-off-bg-color);
    inline-size: $width;
    border-radius: 4rem;

    appearance: none;
    pointer-events: none;
    touch-action: pan-y;
    border: none;
    outline-offset: 5px;
    box-sizing: content-box;

    flex-shrink: 0;
    display: grid;
    align-items: center;
    grid: [track] 1fr / [track] 1fr;

    transition: background-color 0.25s ease;

    &::before {
      content: "";
      cursor: pointer;
      pointer-events: auto;
      grid-area: track;
      inline-size: $thumb-width;
      block-size: $height;
      background-color: var(--switch-off-thumb-color);
      border-radius: 50%;
      translate: var(--thumb-position);
      transition: translate 0.25s ease, background-color 0.25s ease;
    }

    &:checked {
      background-color: var(--switch-on-bg-color);
      --thumb-position: calc((2rem - 100%) * var(--isLTR));

      &::before {
        background-color: var(--switch-on-thumb-color);
      }
    }
  }

  :global(.rtl) {
    [role="switch"] {
      --isLTR: -1;
    }
  }
</style>
