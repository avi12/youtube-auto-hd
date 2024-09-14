# YouTube Auto HD + FPS

A browser extension that sets the quality of YouTube videos according to the user's preference, based on the video's
FPS.
Available for:

- [Google Chrome](https://chrome.google.com/webstore/detail/fcphghnknhkimeagdglkljinmpbagone) ![Chrome Web Store](https://img.shields.io/chrome-web-store/users/fcphghnknhkimeagdglkljinmpbagone?color=white&label=users&style=flat-square)
- [Mozilla Firefox](https://addons.mozilla.org/firefox/addon/youtube-auto-hd-fps)
  90+ ![Mozilla Add-on](https://img.shields.io/amo/users/youtube-auto-hd-fps?color=white&label=users&style=flat-square)
- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/ggnepcoiimddpmjaoejhdfppjbcnfaom) ![users count](https://img.shields.io/badge/dynamic/json?label=users&query=activeInstallCount&style=flat-square&color=white&url=https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/ggnepcoiimddpmjaoejhdfppjbcnfaom)
- [Opera](https://addons.opera.com/en/extensions/details/youtube-auto-hd-fps)
- [Safari](https://apps.apple.com/us/app/id1546729687) - maintained
  by [carlosjeurissen](https://github.com/carlosjeurissen)
- [Naver Whale](https://store.whale.naver.com/detail/njejcbikjebbmiggdpdggelmoifodjhh) - maintained
  by [carlosjeurissen](https://github.com/carlosjeurissen)

![A screenshot from the extension's pop-up page](https://github.com/avi12/youtube-auto-hd/assets/6422804/fc7a4581-0162-427c-a6bc-7d96e68a3961)

Made by [avi12](https://avi12.com)

Powered by [Plasmo](https://github.com/plasmohq/plasmo)

## Contact me

You can [suggest a feature](https://github.com/avi12/youtube-auto-hd/issues/new?assignees=&labels=enhancement&projects=&template=feature_request.yml&title=%5BFeature+request%5D+)
or [report a bug](https://github.com/avi12/youtube-auto-hd/issues/new?assignees=&labels=bug&projects=&template=bug_report.yml&title=%5BBug%5D+)

## Known issue

Due to the way the browsers handle extensions, when an extension receives an update, content scripts in previously-open web
pages cannot use the [Storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage) until the user reloads them, which means that if YTHD received an update and the user
attempts to change a setting, he must reload the such pages for the settings to take effect

### A semi working solution

To provide a smooth user experience, I decided to use the last settings that were fetched

## Translating

You can translate the extension to your own language by filling [this form](https://apps.jeurissen.co/auto-hd-fps-for-youtube/translate)
Filling will grant you access to a Google Spreadsheet via email, in which you can contribute your translations

## Requirements for setting up

Install [Node.js](https://nodejs.org) and [PNPM](https://pnpm.io/installation)

## Install dependencies

```shell script
pnpm i
```

## Start the dev server

### Chromium browsers

```shell script
pnpm dev
```

### Firefox

```shell script
pnpm build:firefox
```

## Running

### Chromium/Chrome

```shell script
pnpm run-chromium
```

### Chromium/Chrome RTL

```shell script
pnpm run-chromium:rtl
```

### Edge on Windows 10/11

```shell
pnpm run-edge:windows
```

### Opera on Windows 10/11

As of September 30th, 2023, Opera 102's installer [automatically sets itself as the default browser](https://www.reddit.com/r/assholedesign/comments/j2j85x), and therefore I recommend installing it on a virtual machine like [Windows Sandbox](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/windows-sandbox-overview)
Of course, if you decide to go through this route, you'll need to [build & pack](https://github.com/avi12/youtube-auto-hd#build--pack) every time you modify a script

```shell
pnpm run-opera:windows
```

### Firefox

```shell
pnpm run-firefox
```

### Phone/tablet

1. Install [Android Studio](https://developer.android.com/studio) on your operating system
2. Create an AVD (Android Virtual Device)
    - For a phone emulator, choose one that
      has [Play Store preinstalled](https://user-images.githubusercontent.com/6422804/167658974-9ec9d13f-d297-4e8b-85d6-376809f34aab.png)
    - For a tablet emulator, [follow these steps](https://aamnah.com/android/play_store_emulator_install_missing) after
      creating it to have Play Store
      preinstalled
3. Run the emulator:
   ```shell
    emulator @DEVICE_NAME
   ```
4. I recommend creating a Google account specifically to be used with the emulator
### Chromium for Android testing
  1. Install [Kiwi Browser](https://play.google.com/store/apps/details?id=com.kiwibrowser.browser)
  2. First get the emulator ID:
     ```shell
     adb devices
     ```
     Then:
       - On Windows 10/11, you can run:
          ```shell
          set id=ID & pnpm build-pack:test-push
          ```
      - Otherwise, if you're using PowerShell, run:
        ```shell
        pnpm build-pack:test; `
        $zip = "chrome-mv3-prod.zip"; `
        $destAndroid = "/storage/emulated/0/TestYTHD/$zip"; `
        $ID = "emulator-####"; `
        adb -s $ID shell rm $destAndroid; `
        adb -s $ID push "build/$zip" $destAndroid;
        ```
        where you assign `$ID` with the emulator ID
   3. <details>
      <summary>Side-load the extension on Kiwi</summary>
      <!--suppress HtmlDeprecatedAttribute -->
      <img align="top" src="https://user-images.githubusercontent.com/6422804/167670341-a0cae554-e922-40b3-b8ed-7bec1ebf17bc.png" alt="Choose zip from storage">
      </details>
   4. Select the ZIP in the TestYTHD folder
   5. To reload, you must first remove the extension and then repeat steps 2-4
   6. To debug, enter `chrome://inspect/#devices`

### Firefox for Android testing
  1. Install [Firefox](https://play.google.com/store/apps/details?id=org.mozilla.firefox)
  2. In the terminal:
     ```shell
     adb shell pm grant org.mozilla.firefox android.permission.READ_EXTERNAL_STORAGE
     ```
  3. In the app:
     1. Press ⋮ (menu button) → Settings → Enable "Remote debugging via USB"
     2. Get the emulator ID via
        ```shell
        adb devices
        ```
  4. Create 2 terminals
     - In the first one, run `dev:firefox`
     - In the second one, run
       ```shell
       pnpm run-firefox:android --android-device=ID
       ```
       where you replace `ID` with the emulator ID
  5. To reload:
      1. Modify a script
      2. Wait until the extension is re-added
      3. Reload the web page
         Notice that due to [web-ext run](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-run)
         using the same files that Plasmo uses to convert the development files into extension-usable script files,
         Plasmo might crash and so you'll have to restart it every time that you modify a script
  6. To debug:
     1. Open Firefox on your desktop
     2. In the terminal of `run-firefox:android`, find the remote Firefox debugger port (search "TCP port")
     3. Open `about:debugging#/setup` in Firefox
     4. Type in the text box: `localhost:PORT`
     5. In the left sidebar, next to `localhost:PORT`, click <kbd>Connect</kbd> and then click on that list item
     6. Under "Tabs" click <kbd>Inspect</kbd>

### Sideloading onto your daily driver browser

- Chromium-based browsers
  1. Run `dev`
  2. Open the extensions page
  3. Enable "Developer mode"
  4. Open `youtube-auto-hd/build` on your file system
  5. Drag-drop `chrome-mv3-dev` onto the extensions page
- Firefox for desktop:
  1. Run `dev:firefox`
  2. [Follow this guide](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/#:~:text=To%20install%20an%20extension%20temporarily)
  3. In the file system window, select `youtube-auto-hd/build/firefox-mv2-dev/manifest.json`

## Build & pack

```shell
pnpm build-pack
```

### Build & pack for Firefox

```shell
pnpm build-pack:firefox
```

## Contribution

Feel free to contribute! Keep in mind that the license I chose
is [GPL v3](https://github.com/avi12/youtube-auto-hd/blob/main/LICENSE).
If you want to fork, make sure to credit [Avi](https://avi12.com) and link to this repository.
