"use strict";

export const observerOptions = Object.freeze({ childList: true, subtree: true });

export async function getStorage(storageArea: "local" | "sync", key = null): Promise<any> {
  return new Promise(resolve => {
    chrome.storage[storageArea].get(key, result => {
      resolve(key ? result[key] : result);
    });
  });
}

export function getI18n(id: string, backup = ""): string {
  return (id && chrome.i18n.getMessage(id)) || backup;
}

export const Selectors = {
  buttonSettings: ".ytp-settings-button",
  optionQuality: ".ytp-menuitem:last-child",
  menuOption: ".ytp-menuitem",
  player: ".html5-video-player",
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
