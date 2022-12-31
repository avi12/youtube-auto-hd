import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import css from "rollup-plugin-css-only";
import postcss from "rollup-plugin-postcss";
import svelte from "rollup-plugin-svelte";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";

const isProduction = !process.env.ROLLUP_WATCH;

function createConfig(filename, useSvelte = false) {
  return {
    input: `src/${filename}.ts`,
    inlineDynamicImports: true,
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

function createConfigBackground() {
  return {
    input: "src/background.ts",
    output: {
      format: "cjs",
      file: "dist/background.js"
    },
    plugins: [typescript(), commonjs(), isProduction && terser()],
    watch: {
      clearScreen: true
    }
  };
}

function createConfigCss() {
  return {
    input: "src/styles-injected/main.css",
    output: {
      file: "dist/build/styles-injected/main.css"
    },
    plugins: [postcss({ extract: true, minimize: true })],
    watch: {
      clearScreen: true
    }
  };
}

export default [
  createConfig("scripts/ythd-content-script-initialize-desktop"),
  createConfig("scripts/ythd-content-script-initialize-mobile"),
  createConfigBackground(),
  createConfig("popup/popup", true),
  createConfig("permissions/permissions", true),
  createConfigCss()
];
