import autoprefixer from "autoprefixer";
import nesting from "postcss-nesting";
import { sveltePreprocess } from "svelte-preprocess";

export default {
  preprocess: sveltePreprocess(),
  postcss: {
    plugins: [autoprefixer, nesting()]
  }
};
