import packageJson from "./package.json" with { type: "json" };
import autoprefixer from "autoprefixer";
import { execSync } from "node:child_process";
import { defineConfig } from "wxt";

const url = packageJson.repository;
const [, author, email] = packageJson.author.match(/(.+) <(.+)>/)!;

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  publicDir: "src/public",
  manifest: ({ browser, mode: _mode })=> ({
    name: "YouTube Auto HD + FPS",
    description: "__MSG_cj_i18n_02146__",
    homepage_url: url,
    default_locale: "en",
    host_permissions: [
      "https://youtube.com/*",
      "https://*.youtube.com/*",
      "https://www.youtube-nocookie.com/*",
      "https://youtube.googleapis.com/*"
    ],
    permissions: ["cookies", "storage"],
    options_ui: {
      page: "popup.html"
    },
    author: browser === "opera" || browser === "firefox" ? packageJson.author : { email },
    ...browser !== "firefox" && {
      offline_enabled: true,
      minimum_chrome_version: "120.0"
    },
    ...browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          id: "avi6106@gmail.com",
          strict_min_version: "117.0",
          // Anonymous usage reporting is always on, so Firefox is told it is REQUIRED - disclosed
          // once in the install prompt rather than left as a switch in about:addons
          data_collection_permissions: {
            required: ["technicalAndInteraction"]
          }
        }
      },
      developer: {
        name: author,
        url
      }
    }
  }),
  hooks: {
    "zip:extension:done"(_, zipPath) {
      const stores = zipPath.match(/chrome|opera/) ? "chrome,opera" : "firefox";
      execSync(`webext-store-incompat-fixer -i ${zipPath} --stores ${stores}`);
    }
  },
  outDir: "build",
  outDirTemplate: "{{browser}}-mv{{manifestVersion}}-{{mode}}",
  zip: {
    excludeSources: ["*.env", ".env*", "tests/**", "test-browsers/**", "screenshots*/**", "user-data/**"],
    artifactTemplate: "youtube-auto-hd-fps-{{version}}-{{browser}}.zip",
    sourcesTemplate: "youtube-auto-hd-fps-{{version}}-{{browser}}-source.zip"
  },
  modules: ["@wxt-dev/module-svelte"],
  vite: () => ({
    build: {
      sourcemap: "inline"
    },
    css: {
      postcss: {
        plugins: [autoprefixer]
      }
    }
  })
});
