# YouTube Auto HD + FPS

A browser extension that sets the quality of YouTube videos according to the user's preference, based on the video's
FPS.
Available for:

 - [Google Chrome](https://chromewebstore.google.com/detail/fcphghnknhkimeagdglkljinmpbagone) 120+ ![Chrome Web Store](https://img.shields.io/chrome-web-store/users/fcphghnknhkimeagdglkljinmpbagone?color=white&label=users&style=flat-square)
- [Mozilla Firefox](https://addons.mozilla.org/firefox/addon/youtube-auto-hd-fps)
  117+ ![Mozilla Add-on](https://img.shields.io/amo/users/youtube-auto-hd-fps?color=white&label=users&style=flat-square)
- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/ggnepcoiimddpmjaoejhdfppjbcnfaom) 120+ ![users count](https://img.shields.io/badge/dynamic/json?label=users&query=activeInstallCount&style=flat-square&color=white&url=https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/ggnepcoiimddpmjaoejhdfppjbcnfaom)
- [Opera](https://addons.opera.com/en/extensions/details/youtube-auto-hd-fps) 120+
- [Safari](https://apps.apple.com/us/app/id1546729687) - maintained
  by [carlosjeurissen](https://github.com/carlosjeurissen)
- [Naver Whale](https://store.whale.naver.com/detail/njejcbikjebbmiggdpdggelmoifodjhh) - maintained
  by [carlosjeurissen](https://github.com/carlosjeurissen)

![A screenshot from the extension's pop-up page](https://private-user-images.githubusercontent.com/6422804/519377266-5ab156c9-dd51-465f-8016-c84a94d2e064.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjQxODc0NjMsIm5iZiI6MTc2NDE4NzE2MywicGF0aCI6Ii82NDIyODA0LzUxOTM3NzI2Ni01YWIxNTZjOS1kZDUxLTQ2NWYtODAxNi1jODRhOTRkMmUwNjQucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MTEyNiUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTExMjZUMTk1OTIzWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9N2E1ODg5OTRjZjBlMjNkMjE0YjVkOTgxMTg1Zjg3OTBkMzViYWRlODc5YjQ4NjJjYTZlM2IyMzZiZWI3OWI4OCZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.kHhpkGWREaj-t72hkMzVCDBZjUw-hoaJIHXI2xzoxFQ)

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
until the user reloads them. This means that if YTHD received an update and the user
attempts to change a setting, he must reload the such pages for the settings to take effect

### A semi working solution

To provide a smooth user experience, I decided to use the last settings that were fetched

## Translating

You can translate the extension to your own language by
filling [this form](https://apps.jeurissen.co/auto-hd-fps-for-youtube/translate)  
Filling will grant you access to a Google Spreadsheet via email, in which you can contribute your translations

## Requirements for setting up

Install [Node.js](https://nodejs.org) and [Bun](https://bun.sh)

## Install dependencies

```shell script
bun i
```

## Start the dev server and run in a test browser

### Chrome

```shell script
bun dev
```

### Chrome RTL

```shell
bun dev:rtl
```

### Edge

```shell
bun dev:edge
```

### Opera

```shell
bun dev:opera
```

### Firefox

Currently [unsupported](https://github.com/wxt-dev/wxt/issues/230#issuecomment-1806881653)  
Instead, after building you can
follow [this guide](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox)

## Build

### Chrome

```shell script
bun build
```

### Edge

```shell script
bun build:edge
```

### Opera

```shell
bun build:opera
```

### Firefox

```shell
bun build:firefox
```

## Package

### Chrome

```shell
bun package
```

### Edge

```shell
bun package:edge
```

### Opera

```shell
bun package:opera
```

### Firefox

```shell
bun package:firefox
```

## Shorthands

### Chrome

```shell
bun build:package
```

### Edge

```shell
bun build:package:edge
```

### Opera

```shell
bun build:package:opera
```

### Firefox

```shell
bun build:package:firefox
```

## Contribution

Feel free to contribute! Keep in mind that the license I chose
is [GPL v3](https://github.com/avi12/youtube-auto-hd/blob/main/LICENSE)  
If you want to fork, make sure to credit [Avi](https://avi12.com) and link to this repository.
