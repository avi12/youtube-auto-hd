<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    checked?: boolean;
    change?: (isChecked: boolean) => void;
    children?: Snippet;
    className?: string;
  }

  const random = Math.random();

  // eslint-disable-next-line prefer-const
  let { checked = $bindable(false), children, className, change }: Props = $props();
</script>

<article class="ccc-switch {className}" dir={document.querySelector(".rtl") ? "rtl" : "ltr"}>
  <input
    bind:checked
    class="ccc-switch__input"
    id="switch-{random}"
    onchange={e => change?.(e.currentTarget.checked)}
    role="switch"
    type="checkbox" />
  <label class="ccc-switch__switch" for="switch-{random}"></label>
  <label class="ccc-switch__label" for="switch-{random}"> {@render children?.()}</label>
</article>

<style>
  @import url("node_modules/ccc-components/styles/switch.css");

  .ccc-switch {
    --ccc-accent-color: var(--switch-on-thumb-color);
    display: flex;
    flex-direction: row-reverse;
    align-items: center;

    & > * {
      cursor: pointer;
    }

    & .ccc-switch__label {
      width: 100%;
      margin-inline-start: 0;
      padding-inline-end: 21px;
    }
  }
</style>
