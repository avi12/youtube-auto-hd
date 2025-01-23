# YouTube Auto HD + FPS

A browser extension that sets the quality of YouTube videos according to the user's preference, based on the video's
FPS.
Available for:

- [Google Chrome](https://chrome.google.com/webstore/detail/fcphghnknhkimeagdglkljinmpbagone) ![Chrome Web Store](https://img.shields.io/chrome-web-store/users/fcphghnknhkimeagdglkljinmpbagone?color=white&label=users&style=flat-square)
- [Mozilla Firefox](https://addons.mozilla.org/firefox/addon/youtube-auto-hd-fps)
  101+ ![Mozilla Add-on](https://img.shields.io/amo/users/youtube-auto-hd-fps?color=white&label=users&style=flat-square)
- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/ggnepcoiimddpmjaoejhdfppjbcnfaom) ![users count](https://img.shields.io/badge/dynamic/json?label=users&query=activeInstallCount&style=flat-square&color=white&url=https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/ggnepcoiimddpmjaoejhdfppjbcnfaom)
- [Opera](https://addons.opera.com/en/extensions/details/youtube-auto-hd-fps)
- [Safari](https://apps.apple.com/us/app/id1546729687) - maintained
  by [carlosjeurissen](https://github.com/carlosjeurissen)
- [Naver Whale](https://store.whale.naver.com/detail/njejcbikjebbmiggdpdggelmoifodjhh) - maintained
  by [carlosjeurissen](https://github.com/carlosjeurissen)

![A screenshot from the extension's pop-up page](https://github.com/user-attachments/assets/62ea0380-c2ac-44d8-a7b1-2b2b28dcbd68)

Made by [Avi](https://avi12.com)

Powered by [WXT](https://github.com/wxt-dev/wxt)

## Contact me

You
can [suggest a feature](https://github.com/avi12/youtube-auto-hd/issues/new?assignees=&labels=enhancement&projects=&template=feature_request.yml&title=%5BFeature+request%5D+)
or [report a bug](https://github.com/avi12/youtube-auto-hd/issues/new?assignees=&labels=bug&projects=&template=bug_report.yml&title=%5BBug%5D+)

## Known issue

Due to the way the browsers handle extensions, when an extension receives an update, content scripts in previously-open
web
pages cannot use the [Storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage)
until the user reloads them, which means that if YTHD received an update and the user
attempts to change a setting, he must reload the such pages for the settings to take effect

### A semi working solution

To provide a smooth user experience, I decided to use the last settings that were fetched

## Translating

You can translate the extension to your own language by
filling [this form](https://apps.jeurissen.co/auto-hd-fps-for-youtube/translate)  
Filling will grant you access to a Google Spreadsheet via email, in which you can contribute your translations

## Requirements for setting up

Install [Node.js](https://nodejs.org) and [PNPM](https://pnpm.io/installation)

## Install dependencies

```shell script
pnpm i
```

## Start the dev server & run in a test browser

### Chrome

```shell script
pnpm dev
```

### Chrome RTL

```shell
pnpm dev:rtl
```

### Edge

```shell
pnpm dev:edge
```

### Opera

```shell
pnpm dev:opera
```

### Firefox

Currently [unsupported](https://github.com/wxt-dev/wxt/issues/230#issuecomment-1806881653)  
Instead, after building you can
follow [this guide](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox)

## Build

### Chrome

```shell script
pnpm build
```

### Edge

```shell script
pnpm build:edge
```

### Opera

```shell
pnpm build:opera
```

### Firefox

```shell
pnpm build:firefox
```

## Package

### Chrome

```shell
pnpm package
```

### Edge

```shell
pnpm package:edge
```

### Opera

```shell
pnpm package:opera
```

### Firefox

```shell
pnpm package:firefox
```

## Shorthands

### Chrome

```shell
pnpm build:package
```

### Edge

```shell
pnpm build:package:edge
```

### Opera

```shell
pnpm build:package:opera
```

### Firefox

```shell
pnpm build:package:firefox
```

## Contribution

Feel free to contribute! Keep in mind that the license I chose
is [GPL v3](https://github.com/avi12/youtube-auto-hd/blob/main/LICENSE)  
If you want to fork, make sure to credit [Avi](https://avi12.com) and link to this repository.
