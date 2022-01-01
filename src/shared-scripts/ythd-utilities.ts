"use strict";

import { initial } from "./ythd-setup";
import type { FpsOptions } from "../types";

export const observerOptions = Object.freeze({ childList: true, subtree: true });

export async function resizePlayerIfNeeded(sizeObj = {}): Promise<void> {
  // TODO: Fix resizing the player
  const { size: isLargeRequired = initial.size, autoResize = initial.autoResize } = Object.assign(
    sizeObj,
    await getStorage("sync")
  );

  if (!autoResize) {
    return;
  }

  const sizeSmall = "m 28,11 0,14 -20,0 0,-14 z m -18,2 16,0 0,10 -16,0 0,-10 z";
  const sizeLarge = "m 26,13 0,10 -16,0 0,-10 z m -14,2 12,0 0,6 -12,0 0,-6 z";

  const elButtonSize = document.querySelector(".ytp-size-button") as HTMLButtonElement;
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

export async function getStorage(storageArea: "local" | "sync", key = null): Promise<any> {
  return new Promise(resolve => {
    chrome.storage[storageArea].get(key, result => {
      resolve(key ? result[key] : result);
    });
  });
}

export function getIsFewerQualityValues(qualities1: FpsOptions, qualities2: FpsOptions): boolean {
  return Object.keys(qualities1).length < Object.keys(qualities2).length;
}

export function getI18n(id: string, backup = ""): string {
  return (id && chrome.i18n.getMessage(id)) || backup;
}


export const Selectors = {
  buttonSettings: ".ytp-settings-button",
  optionQuality: ".ytp-menuitem:last-child",
  menuOption: ".ytp-menuitem",
  player: ".html5-video-player",
  adSkipIn: ".ytp-ad-preview-text",
  adSkipNow: ".ytp-ad-skip-button-text",
  video: "video"
} as const;

export function getElement(elementName: keyof typeof Selectors): Element {
  const elements = [...document.querySelectorAll(Selectors[elementName])];
  return elements.find(isElementVisible);
}

export function getElements(elementName: keyof typeof Selectors): Element[] {
  const elements = [...document.querySelectorAll(Selectors[elementName])];
  return elements.filter(isElementVisible);
}


function isElementVisible(element: HTMLElement): boolean {
  return element?.offsetWidth > 0 && element?.offsetHeight > 0;
}
