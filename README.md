# YouTube Auto HD + FPS

A browser extension that sets the quality of YouTube videos according to the user's preference, based on the video's
FPS.  
Available for:

- [Google Chrome](https://chrome.google.com/webstore/detail/fcphghnknhkimeagdglkljinmpbagone) ![Chrome Web Store](https://img.shields.io/chrome-web-store/users/fcphghnknhkimeagdglkljinmpbagone?color=white&label=users&style=flat-square)
- [Mozilla Firefox](https://addons.mozilla.org/addon/youtube-auto-hd-fps) ![Mozilla Add-on](https://img.shields.io/amo/users/youtube-auto-hd-fps?color=white&label=users&style=flat-square)
- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/ggnepcoiimddpmjaoejhdfppjbcnfaom) ![users count](https://img.shields.io/badge/dynamic/json?label=users&query=activeInstallCount&style=flat-square&color=white&url=https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/ggnepcoiimddpmjaoejhdfppjbcnfaom)
- [Opera](https://addons.opera.com/en/extensions/details/youtube-auto-hd-fps)
- [Safari](https://apps.apple.com/us/app/id1546729687) - maintained
  by [carlosjeurissen](https://github.com/carlosjeurissen)

![A screenshot from the extension's pop-up page](https://user-images.githubusercontent.com/6422804/222708593-5bd67a62-8f99-47e9-b4e0-c00cb7eb09b7.png)

Made by [avi12](https://avi12.com)

Powered by [Plasmo](https://github.com/plasmohq/plasmo)

## Known issue

Due to the way the browsers handle extensions, when an extension receives an update, content scripts in already-open web
pages cannot use the [Storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage),
until the user reloads those web pages.  
In the context of this extension, it means that when the extension receives an update, as long as the user doesn't
reload YouTube web pages, the extension cannot get the data regarding the user-preferred qualities.

### A kind-of working solution

To provide a smooth user experience, I decided to use the last qualities that were fetched.

This solution is not perfect, since if the user wants to update the quality of the videos in the currently-open web
pages using the popup page, it will not update dynamically.  
However, this is the only viable solution, as the alternative would be to auto-reload web pages, which would result in a
bad user experience.

## Translating

You can translate the extension to your own language by
filling [this form](https://apps.jeurissen.co/auto-hd-fps-for-youtube/translate).  
Filling will grant you access to a Google Sheets spreadsheet via email, in which you can contribute your translations.

## Requirements for setting up

Install [Node.js](https://nodejs.org) and [PNPM](https://pnpm.js.org/en/installation).

## Install dependencies:

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

```shell
pnpm run-opera:windows
```

### Firefox

```shell
pnpm run-firefox
```

### Mobile/tablet

1. Install [Android Studio](https://developer.android.com/studio) on your operating system
2. Create an AVD (Android Virtual Device)
   1. For a phone emulator, choose one that
      has [Play Store preinstalled](https://user-images.githubusercontent.com/6422804/167658974-9ec9d13f-d297-4e8b-85d6-376809f34aab.png)
   2. For a tablet emulator, [follow these steps](https://aamnah.com/android/play_store_emulator_install_missing) after
      creating it to have Play Store
      preinstalled
3. Run the emulator:
   ```shell
    emulator @DEVICE_NAME
   ```
4. Download [Kiwi browser](https://play.google.com/store/apps/details?id=com.kiwibrowser.browser). I recommend creating
   a Google account specifically to be used with the emulator
5. Run `pnpm build-pack:test`
6. Push the ZIP to the emulator. If using PowerShell:
   ```powershell
   $zip = "chrome-mv3-prod.zip";
   $destAndroid = "/storage/emulated/0/Download/$zip";
   adb shell rm $destAndroid;
   adb push "build/$zip" $destAndroid;
   ```
   1. If you're running both emulators, use argument `-s ID` to specify the ID of the emulator you want to interact
      with  
      E.g. `adb -s ID shell ...`
   2. Find out the IDs using `adb devices`
7. <details>
   <summary>Side-load the extension on Kiwi</summary>
   <!--suppress HtmlDeprecatedAttribute -->
   <img align="top" src="https://user-images.githubusercontent.com/6422804/167670341-a0cae554-e922-40b3-b8ed-7bec1ebf17bc.png" alt="Choose zip from storage">
   </details>
8. Select the ZIP in the Download folder
9. To reload, you must first remove the extension and then repeat steps 5-7

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
If you want to fork, make sure to credit [avi12](https://avi12.com) and link to this repository.
