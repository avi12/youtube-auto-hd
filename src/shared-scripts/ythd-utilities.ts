"use strict";

import type { FpsList, FpsOptions, Label } from "../types";
import { initial } from "./ythd-setup";
import type { QualityLabels, VideoQuality } from "../types";

export const observerOptions: MutationObserverInit = Object.freeze({ childList: true, subtree: true });
window.ythdLastUserQualities = { ...initial.qualities };

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
  // Global
  video: "video",
  // Desktop
  buttonSettings: ".ytp-settings-button",
  pathSizeToggle: `path[d*="m 28,"], path[d*="m 26,"]`,
  optionQuality: ".ytp-menuitem:last-child",
  menuOption: ".ytp-menuitem",
  menuOptionContent: ".ytp-menuitem-content",
  panelMenu: ".ytp-panel-menu",
  panelHeader: ".ytp-panel-header button",
  settingsMenu: ".ytp-settings-menu",
  player: ".html5-video-player",
  // Mobile
  mobileQualityDropdown: "select[id^=player-quality-dropdown]",
  mobileQualityDropdownWrapper: ".player-quality-settings",
  mobileMenuButton: ".mobile-topbar-header-content ytm-menu button",
  mobileOption: "div[role=dialog] ytm-menu-item",
  mobileOkButton: ".dialog-buttons [class*=material-button-button]",
} as const;

export function getVisibleElement<T extends HTMLElement>(elementName: keyof typeof Selectors): T {
  const elements = [...document.querySelectorAll(Selectors[elementName])] as T[];
  return elements.find(isElementVisible);
}

export async function getElementByMutationObserver(selector: keyof typeof Selectors): Promise<HTMLElement> {
  return new Promise(resolve => {
    new MutationObserver((_, observer) => {
      const element = getVisibleElement(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    }).observe(document, observerOptions);
  });
}


function isElementVisible(element: HTMLElement): boolean {
  return element?.offsetWidth > 0 && element?.offsetHeight > 0;
}

export function getFpsFromRange(qualities: FpsOptions, fpsToCheck: FpsList): FpsList {
  const fpsList = Object.keys(qualities)
    .map(Number)
    .sort((a, b) => b - a) as FpsList[];
  while (fpsList.length > 1) {
    const fpsCurrent = fpsList.pop() as FpsList;
    if (fpsToCheck <= fpsCurrent) {
      return fpsCurrent;
    }
  }
  return fpsList[0];
}

export async function getPreferredQualities(): Promise<FpsOptions> {
  try {
    const userQualities = ((await getStorage("local", "qualities")) ?? {}) as FpsOptions;
    window.ythdLastUserQualities = { ...initial.qualities, ...userQualities };
    return window.ythdLastUserQualities;
  } catch {
    // Handling "Error: Extension context invalidated"

    // This error typically occurs when the extension updates
    // but the user hasn't refreshed the page, which typically causes
    // the player settings to open when seeking through a video
    return window.ythdLastUserQualities;
  }
}

export function getIQuality(qualitiesCurrent: VideoQuality[] | Label[], qualityPreferred: VideoQuality | Label): number {
  return qualitiesCurrent.findIndex((quality: VideoQuality | Label) => quality === qualityPreferred);
}

export function getIsQualityLower(elQuality: HTMLElement | undefined, qualityPreferred: VideoQuality): boolean {
  if (!elQuality) {
    return true;
  }
  const labelQuality = elQuality.textContent as QualityLabels;
  const qualityVideo = parseInt(labelQuality) as VideoQuality;
  return qualityVideo < qualityPreferred;
}
