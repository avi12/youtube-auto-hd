"use strict";

export const observerOptions: MutationObserverInit = Object.freeze({ childList: true, subtree: true });

export async function getStorage<T>(storageArea: "local" | "sync", key = null): Promise<T> {
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
  pathSizeToggle: `path[d*="m 28,"], path[d*="m 26,"]`,
  optionQuality: ".ytp-menuitem:last-child",
  menuOption: ".ytp-menuitem",
  menuOptionContent: ".ytp-menuitem-content",
  panelMenu: ".ytp-panel-menu",
  panelHeader: ".ytp-panel-header button",
  settingsMenu: ".ytp-settings-menu",
  player: ".html5-video-player",
  video: "video"
} as const;

export function getVisibleElement<T extends HTMLElement>(elementName: keyof typeof Selectors): T {
  const elements = [...document.querySelectorAll(Selectors[elementName])] as T[];
  return elements.find(isElementVisible);
}

function isElementVisible(element: HTMLElement): boolean {
  return element?.offsetWidth > 0 && element?.offsetHeight > 0;
}
