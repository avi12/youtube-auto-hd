"use strict";

import { initial } from "./yt-auto-hd-setup";

export async function resizePlayerIfNeeded(sizeObj = {}) {
  const { size: isLargeRequired = initial.size, autoResize = initial.autoResize } = Object.assign(
    sizeObj,
    await getStorage("sync")
  );

  if (!autoResize) {
    return;
  }

  const sizeSmall = "m 28,11 0,14 -20,0 0,-14 z m -18,2 16,0 0,10 -16,0 0,-10 z";
  const sizeLarge = "m 26,13 0,10 -16,0 0,-10 z m -14,2 12,0 0,6 -12,0 0,-6 z";

  const elButtonSize = document.body.querySelector(".ytp-size-button");
  const sizeCurrent = elButtonSize.querySelector("path")?.getAttribute("d");
  if (!sizeCurrent) {
    return;
  }

  const isCurrentlySmall = sizeCurrent === sizeSmall;
  const isCurrentlyLarge = sizeCurrent === sizeLarge;

  if (isLargeRequired) {
    if (isCurrentlySmall) {
      elButtonSize.click();
    }
  } else {
    if (isCurrentlyLarge) {
      elButtonSize.click();
    }
  }
}

export async function getStorage(storageArea, key = null) {
  return new Promise(resolve => {
    chrome.storage[storageArea].get(key, result => {
      resolve(key ? result[key] : result);
    });
  });
}

export function getIsFewerQualityValues(qualities1, qualities2) {
  return Object.keys(qualities1).length < Object.keys(qualities2).length;
}

export function getI18n(id, backup = "") {
  return (id && chrome.i18n.getMessage(id)) || backup;
}
