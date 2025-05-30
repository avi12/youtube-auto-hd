import autoprefixer from "autoprefixer";
import nesting from "postcss-nesting";
import { defineConfig, type UserManifest } from "wxt";
import { execSync } from "child_process";
import fs from "fs";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  publicDir: "src/public",
  manifest({ browser }) {
    const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
    const url = packageJson.repository;
    const [, author, email] = packageJson.author!.match(/(.+) <(.+)>/);
    let manifest: UserManifest = {
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
      permissions: ["cookies", "storage"],
      author: browser === "opera" || browser === "firefox" ? packageJson.author : { email }
    };
    if (browser === "firefox") {
      manifest = {
        ...manifest,
        browser_specific_settings: {
          gecko: {
            id: "avi6106@gmail.com"
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
      manifest.action!.default_icon = manifest.icons;
      manifest.options_ui = {
        page: manifest.action?.default_popup ?? "popup.html",
        // If not Firefox
        ...(!manifest.browser_specific_settings && {
          browser_style: true
        })
      };
    },
    "zip:extension:done"(_, zipPath) {
      if (zipPath.match(/chrome|opera/)) {
        execSync(`webext-store-incompat-fixer -i ${zipPath} --stores chrome,opera`);
      } else if (zipPath.includes("edge")) {
        const supportedLocales = ["en", "he", "be"];
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
    excludeSources: ["*.env", ".env*"],
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
        plugins: [nesting, autoprefixer]
      }
    }
  }),
  webExt: {
    disabled: true // https://wxt.dev/guide/essentials/config/browser-startup.html
  }
});
