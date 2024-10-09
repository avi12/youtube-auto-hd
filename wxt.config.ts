import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import autoprefixer from "autoprefixer";
import nesting from "postcss-nesting";
import { defineConfig, type UserManifest } from "wxt";
import { execSync } from "child_process";
import fs from "fs";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  manifest({ browser, manifestVersion }) {
    const url = process.env.npm_package_repository;
    // @ts-expect-error Handling the input correctly
    const [, author, email] = process.env.npm_package_author!.match(/(.+) <(.+)>/);
    let manifest: UserManifest = {
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
        page: "popup.html",
        browser_style: true
      }
    };
    if (browser === "opera") {
      // @ts-expect-error Two possible values, depending on the browser
      manifest.author = process.env.npm_package_author;
    } else if (manifestVersion === 3) {
      manifest.author = { email };
    }
    if (browser === "edge") {
      manifest.name = "Auto HD for YouTube";
    }
    if (browser === "firefox") {
      manifest = {
        ...manifest,
        browser_specific_settings: {
          gecko: {
            id: "avi6106@gmail.com",
            strict_min_version: "90.0"
          }
        },
        developer: {
          name: author,
          url
        }
      };
    } else {
      // if not Firefox
      manifest.offline_enabled = true;
    }
    return manifest;
  },
  hooks: {
    "build:manifestGenerated"(_, manifest) {
      (manifest.action || manifest.browser_action)!.default_icon = manifest.icons;
    },
    "zip:extension:done"(_, zipPath) {
      if (zipPath.match(/chrome|opera/)) {
        execSync(`webext-store-incompat-fixer -i ${zipPath} --stores chrome,opera`);
      } else if (zipPath.includes("edge")) {
        const supportedLocales = ["en", "he", "it"];
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
  zip: {
    excludeSources: ["*.env", ".env*"],
    artifactTemplate: "youtube-auto-hd-fps-{{version}}-{{browser}}.zip",
    sourcesTemplate: "youtube-auto-hd-fps-{{version}}-{{browser}}-source.zip"
  },
  modules: ["@wxt-dev/module-svelte"],
  svelte: {
    vite: {
      preprocess: [
        vitePreprocess({
          style: {
            // @ts-expect-error Incompatible types
            plugins: [autoprefixer, nesting()]
          }
        })
      ]
    }
  }
});
