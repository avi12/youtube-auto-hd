import resolve from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-only";
import commonjs from "@rollup/plugin-commonjs";

const isProduction = !process.env.ROLLUP_WATCH;

function createConfig(filename, useSvelte = false) {
  return {
    input: `src/${filename}.js`,
    output: {
      format: "iife",
      file: `dist/build/${filename}.js`
    },
    plugins: [
      useSvelte && css({ output: "bundle.css" }),
      useSvelte &&
        svelte({
          compilerOptions: {
            dev: !isProduction
          }
        }),
      commonjs(),
      resolve({
        browser: true,
        dedupe: ["svelte"]
      }),
      isProduction && terser()
    ],
    watch: {
      clearScreen: false
    }
  };
}

export default [
  createConfig("popup", true),
  createConfig("background"),
  createConfig("yt-auto-hd-content-script-initialize")
];
