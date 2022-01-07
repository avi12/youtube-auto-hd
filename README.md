# YouTube Auto HD + FPS

A browser extension that sets the quality of YouTube videos according to the user's preference, based on the video's
FPS.  
Available for:

- [Google Chrome](https://chrome.google.com/webstore/detail/fcphghnknhkimeagdglkljinmpbagone) ![Chrome Web Store](https://img.shields.io/chrome-web-store/users/fcphghnknhkimeagdglkljinmpbagone?color=white&label=users&style=flat-square)
- [Mozilla Firefox](https://addons.mozilla.org/addon/youtube-auto-hd-fps) ![Mozilla Add-on](https://img.shields.io/amo/users/youtube-auto-hd-fps?color=white&label=users&style=flat-square)
- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/ggnepcoiimddpmjaoejhdfppjbcnfaom) ![users count](https://img.shields.io/badge/dynamic/json?label=users&query=activeInstallCount&style=flat-square&color=white&url=https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/ggnepcoiimddpmjaoejhdfppjbcnfaom)
- [Opera](https://addons.opera.com/en/extensions/details/youtube-auto-hd-fps)

![A screenshot from the extension's pop-up page](https://user-images.githubusercontent.com/6422804/148557807-3cd5c3cb-9d06-456a-bcff-25bf2eecef04.png)

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

## Build & pack

```shell
pnpm build-pack
```

### Build for Firefox (first run `pnpm build-pack`)

```shell
pnpm build-for-firefox
```

### Build for Opera (first run `pnpm build-pack`)

```shell
pnpm build-for-opera
```

## Contribution

Feel free to contribute! Keep in mind that the license I chose
is [GPL v3](https://github.com/avi12/youtube-auto-hd/blob/main/LICENSE).  
If you want to fork, make sure to credit [avi12](https://avi12.com) and link to this repository.
