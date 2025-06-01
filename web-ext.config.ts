import dotenv from "dotenv";
import { defineWebExtConfig } from "wxt";
import { execSync } from "child_process";

const [, , , ...argv] = process.argv;
const browser = argv.at(-1) || argv.at(-2) || "chrome";
let executable = "";
if (browser.match(/chrome|firefox/)) {
  [, executable] = execSync(`pnpx @puppeteer/browsers install ${browser}@stable --path test-browsers`)
    .toString()
    .trim()
    .split(" ");
}
const path = (() => {
  const osMap: Partial<Record<NodeJS.Platform, string>> = {
    win32: ".env.windows",
    darwin: ".env.mac",
    linux: ".env.linux"
  };
  return osMap[process.platform] || "";
})();

const env = dotenv.configDotenv({ path }).parsed as {
  VITE_PATH_EDGE: string;
  VITE_PATH_OPERA: string;
};

const { VITE_LANG = "en", VITE_BLANK = "" } = process.env;
export default defineWebExtConfig({
  binaries: {
    ...(executable && { [browser]: executable }),
    edge: env.VITE_PATH_EDGE,
    opera: env.VITE_PATH_OPERA.replace("USERPROFILE", process.env.HOME!)
  },
  startUrls: [VITE_BLANK ? "about:blank" : "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
  chromiumArgs: [`--lang=${VITE_LANG}`],
  ...(browser === "chrome" && VITE_LANG.match(/en|he/) && VITE_BLANK && { disabled: true })
});
