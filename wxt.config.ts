import packageJson from "./package.json" with { type: "json" };
import { auth, drive } from "@googleapis/drive";
import autoprefixer from "autoprefixer";
import { unzipSync } from "fflate";
import { execSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { defineConfig } from "wxt";

const url = packageJson.repository;
const [, author, email] = packageJson.author.match(/(.+) <(.+)>/)!;

// Firefox and Opera both review the source before publishing, and WXT emits a source zip for
// exactly those two. Uploading it here means the reviewable archive can never be a stale copy
// someone dragged into Drive by hand - it is the zip this build just produced.
const DRIVE_FOLDER_ENV_BY_BROWSER: Record<string, string> = {
  firefox: "DRIVE_FOLDER_FIREFOX",
  opera: "DRIVE_FOLDER_OPERA"
};
// An OAuth credential for the Drive account that owns those folders, minted the same way Video
// Time Manager mints its own (scripts/mint-drive-credentials.ts there). A service account cannot
// stand in: it would own the uploads and has no Drive quota of its own.
const DRIVE_CREDENTIALS_FILE = "ythd.json";

// The source zip is built from an exclude list, so anything new at the repo root is in it unless
// somebody remembers to exclude it - and this archive goes to a store reviewer. Read the zip back
// and refuse to send one carrying a secret, rather than trusting the list to have kept up.
const SECRET_IN_SOURCES_PATTERN = /(^|\/)(ythd\.json|[^/]*\.env|\.env[^/]*)$/i;

function assertSourcesZipCarriesNoSecret(sourcesZipPath: string) {
  const entries = Object.keys(unzipSync(readFileSync(sourcesZipPath)));
  const leaked = entries.filter(entry => SECRET_IN_SOURCES_PATTERN.test(entry));
  if (leaked.length) {
    throw new Error(
      `Refusing to upload ${basename(sourcesZipPath)} - it contains ${leaked.join(", ")}. `
      + "Add it to zip.excludeSources in wxt.config.ts."
    );
  }
}

async function uploadSourcesToDrive({ sourcesZipPath, browser }: {
  sourcesZipPath: string;
  browser: string;
}) {
  assertSourcesZipCarriesNoSecret(sourcesZipPath);

  const folderEnvName = DRIVE_FOLDER_ENV_BY_BROWSER[browser];
  if (!folderEnvName) {
    return;
  }

  // Anyone building from the published source has no credential and nothing to upload with, so
  // this stays quiet for them rather than failing a zip they only wanted the artifact from.
  if (!existsSync(DRIVE_CREDENTIALS_FILE)) {
    console.log(`No ${DRIVE_CREDENTIALS_FILE} - keeping ${basename(sourcesZipPath)} local`);
    return;
  }

  // Past that point the machine IS meant to upload, so a missing folder is a misconfiguration
  // worth stopping for - silently skipping is how uploads quietly stop happening.
  const folderId = process.env[folderEnvName];
  if (!folderId) {
    throw new Error(`${folderEnvName} is not set - the ${browser} source zip has nowhere to go`);
  }

  const client = drive({
    version: "v3",
    auth: new auth.GoogleAuth({
      keyFile: DRIVE_CREDENTIALS_FILE,
      scopes: "https://www.googleapis.com/auth/drive"
    })
  });
  const { data } = await client.files.create({
    requestBody: {
      name: basename(sourcesZipPath),
      parents: [folderId]
    },
    media: {
      mimeType: "application/zip",
      body: createReadStream(sourcesZipPath)
    },
    fields: "id,webViewLink"
  });
  console.log(`Uploaded ${basename(sourcesZipPath)} to Drive: ${data.webViewLink}`);
}

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
    },
    "zip:sources:done"(wxt, sourcesZipPath) {
      return uploadSourcesToDrive({
        sourcesZipPath,
        browser: wxt.config.browser
      });
    }
  },
  outDir: "build",
  outDirTemplate: "{{browser}}-mv{{manifestVersion}}-{{mode}}",
  zip: {
    excludeSources: [
      "*.env",
      ".env*",
      "ythd.json",
      "tests/**",
      "test-browsers/**",
      "screenshots*/**",
      "user-data/**"
    ],
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
