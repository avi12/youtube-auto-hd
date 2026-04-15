import packageJson from "./package.json" assert { type: "json" };
import autoprefixer from "autoprefixer";
import { execSync } from "node:child_process";
import fs from "node:fs";
import { defineConfig } from "wxt";

const url = packageJson.repository;
const [, author, email] = packageJson.author.match(/(.+) <(.+)>/)!;

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  publicDir: "src/public",
  manifest: ({ browser, mode })=> ({
    name: browser === "edge" ? "Auto HD for YouTube" : "YouTube Auto HD + FPS",
    description: "__MSG_cj_i18n_02146__",
    homepage_url: url,
    default_locale: "en",
    host_permissions: [
      "https://youtube.com/*",
      "https://*.youtube.com/*",
      "https://www.youtube-nocookie.com/*",
      "https://youtube.googleapis.com/*"
    ],
    permissions: ["cookies", "storage", ...(mode === "development" ? ["management"] : [])],
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
          data_collection_permissions: {
            required: ["browsingActivity", "websiteActivity"],
            optional: ["technicalAndInteraction"]
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
      if (zipPath.match(/chrome|opera/)) {
        execSync(`webext-store-incompat-fixer -i ${zipPath} --stores chrome,opera`);
      } else if (zipPath.includes("edge")) {
        const supportedLocales = ["de", "en", "eo", "gl", "he", "ia", "it", "lb", "pl", "pt", "pt_BR", "pt_PT", "rm", "szl"];
        execSync(
          `webext-store-incompat-fixer -i ${zipPath} --stores edge --edge-locale-inclusions ${supportedLocales}`
        );
        const zipAdaptedForEdge = zipPath.replace(".zip", "__adapted_for_edge.zip");
        fs.unlinkSync(zipPath);
        fs.renameSync(zipAdaptedForEdge, zipPath);
      } else {
        execSync(`webext-store-incompat-fixer -i ${zipPath} --stores firefox`);
      }
    }
  },
  outDir: "build",
  outDirTemplate: "{{browser}}-mv{{manifestVersion}}-{{mode}}",
  zip: {
    excludeSources: ["*.env", ".env*", "tests/**", "test-browsers/**", "screenshots*/**"],
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
