# YouTube Auto HD + FPS
A browser extension that sets the quality of YouTube videos according to the user's preference, based on the video's FPS.  
Available for [Google Chrome](https://chrome.google.com/webstore/detail/fcphghnknhkimeagdglkljinmpbagone), [Mozilla Firefox](https://addons.mozilla.org/addon/youtube-auto-hd-fps), [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/ggnepcoiimddpmjaoejhdfppjbcnfaom) and [Opera](https://addons.opera.com/en/extensions/details/youtube-auto-hd-fps).

## Requirements for setting up
Install [Node.js](https://nodejs.org) and [Yarn](https://yarnpkg.com).

## Download dev dependencies:
```shell script
yarn
```
## Start Rollup for development
```shell script
yarn dev
```
Then, open the extensions page in your browser, enable the developer tools (top-right corner usually), and either drag-drop the `dist` folder or click "Load unpacked extension" and choose it.  
If you're on Firefox, simply run the command below.
## Testing
```shell script
yarn run-firefox
```
```shell script
yarn run-chromium # will work for Chrome
```
## Build for production
```shell script
yarn build
```
## Contribution
Feel free to contribute! Keep in mind that the license I chose is [GPL v3](/LICENSE).  
If you want to fork, make sure to credit [avi12](https://avi12.com) and link to this repository.