import resolve from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-only";

const production = !process.env.ROLLUP_WATCH;

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
          // enable run-time checks when not in production
          compilerOptions: {
            dev: !production
          }
          // we'll extract any component CSS out into
          // a separate file - better for performance
        }),

      // If you have external dependencies installed from
      // npm, you'll most likely need these plugins. In
      // some cases you'll need additional configuration -
      // consult the documentation for details:
      // https://github.com/rollup/plugins/tree/master/packages/commonjs
      resolve({
        browser: true,
        dedupe: ["svelte"]
      }),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser()
    ],
    watch: {
      clearScreen: false
    }
  };
}

export default [
  createConfig("popup", true),
  createConfig("background"),
  createConfig("yt-auto-hd-content-script-functions"),
  createConfig("yt-auto-hd-content-script-initialize"),
  createConfig("yt-auto-hd-setup"),
  createConfig("yt-auto-hd-utilities")
];
