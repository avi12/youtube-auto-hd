# YouTube Auto HD + FPS

A browser extension that sets the quality of YouTube videos according to the user's preference, based on the video's
FPS.  
Available for:

- [Google Chrome](https://chrome.google.com/webstore/detail/fcphghnknhkimeagdglkljinmpbagone) ![Chrome Web Store](https://img.shields.io/chrome-web-store/users/fcphghnknhkimeagdglkljinmpbagone?color=white&label=users&style=flat-square)
- [Mozilla Firefox](https://addons.mozilla.org/addon/youtube-auto-hd-fps) ![Mozilla Add-on](https://img.shields.io/amo/users/youtube-auto-hd-fps?color=white&label=users&style=flat-square)
- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/ggnepcoiimddpmjaoejhdfppjbcnfaom) ![users count](https://img.shields.io/badge/dynamic/json?label=users&query=activeInstallCount&style=flat-square&color=white&url=https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/ggnepcoiimddpmjaoejhdfppjbcnfaom)
- [Opera](https://addons.opera.com/en/extensions/details/youtube-auto-hd-fps)
- [Safari](https://apps.apple.com/us/app/id1546729687) - maintained by [carlosjeurissen](https://github.com/carlosjeurissen)

![A screenshot from the extension's pop-up page](https://user-images.githubusercontent.com/6422804/113500084-e26b2a00-9523-11eb-9e6b-5e25a4c6eba0.png)

Made by [avi12](https://avi12.com).

## Known issue

Due to the way the browsers handle extensions, when an extension receives an update, content scripts in already-open web
pages cannot use the [Storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage),
until the user reloads those web pages.  
In the context of this extension, it means that when the extension receives an update, as long as the user doesn't
reload YouTube web pages, the extension cannot get the data regarding the user-preferred qualities.

### A kind-of working solution

To provide a smooth user experience, instead of forcing the user to reload all of the already-open web pages, I decided
to keep track of the last qualities that were fetched, and use them.

This solution is not perfect, since if the user wants to update the quality of the videos in the currently-open web
pages using the popup page (as seen above), it will not update dynamically.  
However, this is the only viable solution, since the alternative one would be to auto-reload web pages, which would lead
to a bad user experience.

## Translating

You can translate the extension to your own language by
filling [this form](https://apps.jeurissen.co/auto-hd-fps-for-youtube/translate).  
After filling, you will get an email, which will grant you access to a spreadsheet, in which you can contribute your
translations.

## Requirements for setting up

Install [Node.js](https://nodejs.org) and [PNPM](https://pnpm.js.org/en/installation).

## Download dev dependencies:

```shell script
pnpm i
```

## Start Rollup for development

```shell script
pnpm dev
```

## Running

### Chromium/Chrome

```shell script
pnpm run-chromium
```

### Edge on Windows 10/11

```shell
pnpm run-edge-windows
```

### Browsers that don't support Manifest v3

1. Build the extension for Firefox/Opera (see below).
2. Open the extensions page in that browser.
3. Enable the developer mode (top-right corner usually).
4. Either drag-drop the browser-compatible ZIP onto the browser or click "Load unpacked extension" and choose it.

### Mobile/tablet

1. Install [Android Studio](https://developer.android.com/studio) on your operating system
2. Create an AVD (Android Virtual Device)
   1. If you're creating a phone emulator, choose one that has [Play Store preinstalled](https://user-images.githubusercontent.com/6422804/167658974-9ec9d13f-d297-4e8b-85d6-376809f34aab.png)
   2. If you're creating a tablet emulator, after creating, [follow these steps](https://aamnah.com/android/play_store_emulator_install_missing) to have Play Store preinstalled
3. Download [Kiwi browser](https://play.google.com/store/apps/details?id=com.kiwibrowser.browser). I recommend creating a Google account specifically to be used with the emulator
4. Run `pnpm run pack`
5. Push the ZIP to the emulator. If using PowerShell:
   ```powershell
   $zip = "youtube_auto_hd_fps_{version}.zip"; # where {version} is the version number of the extension
   $destAndroid = "storage/emulated/Download/$zip";
   adb shell rm $destAndroid;
   adb push "dist_packed/$zip" $destAndroid;
   ```
   1. If you're running both emulators, use argument `-s ID` to specify the ID of the emulator you want to interact with  
      E.g. `adb -s ID shell ...`
   2. Find out the IDs using `adb devices`
6. <details>
   <summary>Sideload the extension on Kiwi</summary>
   <img align="top" src="https://user-images.githubusercontent.com/6422804/167670341-a0cae554-e922-40b3-b8ed-7bec1ebf17bc.png" alt="Choose zip from storage">
   </details>
7. Select the ZIP in the Download folder
8. To reload, you must first remove the extension, re-run `pnpm run pack`, and then load the ZIP again

#### Pro-tip: run the emulator from the CLI:

```shell
emulator @DEVICE_NAME
```

## Build & pack

```shell
pnpm build-pack
```

### Build for Firefox (first run `pnpm build-pack`)

```shell
pnpm build-for-firefox
```

## Contribution

Feel free to contribute! Keep in mind that the license I chose
is [GPL v3](https://github.com/avi12/youtube-auto-hd/blob/main/LICENSE).  
If you want to fork, make sure to credit [avi12](https://avi12.com) and link to this repository.
