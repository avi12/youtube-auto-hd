import resolve from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-only";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import sveltePreprocess from "svelte-preprocess";

const isProduction = !process.env.ROLLUP_WATCH;

function createConfig(filename, useSvelte = false) {
  return {
    input: `src/${filename}.ts`,
    output: {
      format: "cjs",
      file: `dist/build/${filename}.js`
    },
    plugins: [
      useSvelte && css({ output: "bundle.css" }),
      typescript(),
      useSvelte &&
        svelte({
          compilerOptions: {
            dev: !isProduction
          },
          preprocess: sveltePreprocess()
        }),
      commonjs(),
      resolve({
        dedupe: ["svelte"]
      }),
      isProduction && terser()
    ],
    watch: {
      clearScreen: true
    }
  };
}

export default [
  createConfig("scripts/ythd-content-script-initialize"),
  createConfig("background"),
  createConfig("popup/popup", true),
];
