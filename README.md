# YouTube Auto HD + FPS

A browser extension that sets the quality of YouTube videos according to the user's preference, based on the video's FPS.  
Available for:

- [Google Chrome](https://chrome.google.com/webstore/detail/fcphghnknhkimeagdglkljinmpbagone) ![Chrome Web Store](https://img.shields.io/chrome-web-store/users/fcphghnknhkimeagdglkljinmpbagone?color=white&label=users&style=flat-square)
- [Mozilla Firefox](https://addons.mozilla.org/addon/youtube-auto-hd-fps) ![Mozilla Add-on](https://img.shields.io/amo/users/youtube-auto-hd-fps?color=white&label=users&style=flat-square)
- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/ggnepcoiimddpmjaoejhdfppjbcnfaom) ![users count](https://img.shields.io/badge/dynamic/json?label=users&query=activeInstallCount&style=flat-square&color=white&url=https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/ggnepcoiimddpmjaoejhdfppjbcnfaom)
- [Opera](https://addons.opera.com/en/extensions/details/youtube-auto-hd-fps)

![2021-04-04_08-53-33](https://user-images.githubusercontent.com/6422804/113500084-e26b2a00-9523-11eb-9e6b-5e25a4c6eba0.png)

Made by [avi12](https://avi12.com).

## Translating

You can translate the extension to your own language by filling [this form](https://apps.jeurissen.co/auto-hd-fps-for-youtube/translate).  
After filling, you will get an email, which will grant you access to a spreadsheet, in which you can contribute your translations.

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

### Firefox

```shell script
pnpm run-firefox
```

### Other browsers

1. Open the extensions page in your browser.
1. Enable the developer tools (top-right corner usually).
1. Either drag-drop the `dist` folder onto the browser or click "Load unpacked extension" and choose it.

## Contribution

Feel free to contribute! Keep in mind that the license I chose is [GPL v3](https://github.com/avi12/youtube-auto-hd/blob/main/LICENSE).  
If you want to fork, make sure to credit [avi12](https://avi12.com) and link to this repository.
