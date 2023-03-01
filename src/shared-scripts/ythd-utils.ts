import { Storage } from "@plasmohq/storage";

import { initial } from "./ythd-setup";
import { prepareToChangeQualityOnDesktop } from "~cs-helpers/desktop/content-script-desktop";
import { prepareToChangeQualityOnMobile } from "~cs-helpers/mobile/content-script-mobile";
import type { QualityFpsPreferences, VideoFPS, VideoQuality, YouTubeLabel } from "~types";


const STORAGE = new Storage({ area: "local" });

export const OBSERVER_OPTIONS: MutationObserverInit = Object.freeze({ childList: true, subtree: true });
window.ythdLastUserQualities = { ...initial.qualities };

export async function getStorage<T>({
  area,
  key,
  fallback,
  updateWindowKey
}: {
  area: "local" | "sync";
  key: string;
  fallback: T;
  updateWindowKey: string;
}): Promise<T> {
  const storage = new Storage({ area });
  let value: T;
  try {
    value = (await storage.get<T>(key)) ?? fallback;
  } catch {
    value = fallback;
  }
  if (typeof window[updateWindowKey] !== "object") {
    window[updateWindowKey] = value;
  } else {
    window[updateWindowKey] = { ...fallback, ...value };
  }
  return value;
}

export async function getIsExtensionEnabled(): Promise<boolean> {
  return getStorage<boolean>({
    area: "local",
    key: "isExtensionEnabled",
    fallback: initial.isExtensionEnabled,
    updateWindowKey: "ythdExtEnabled"
  });
}

export function getI18n(id: string, backup = ""): string {
  return (id && chrome.i18n.getMessage(id)) || backup;
}

export enum SELECTORS {
  // Global
  title = "title",
  video = "video",
  // Desktop
  buttonSettings = ".ytp-settings-button",
  pathSizeToggle = `path[d*="m 28,"], path[d*="m 26,"]`,
  optionQuality = ".ytp-settings-menu[data-layer] .ytp-menuitem:last-child",
  menuOption = ".ytp-settings-menu[data-layer] .ytp-menuitem",
  menuOptionContent = ".ytp-menuitem-content",
  panelHeaderBack = ".ytp-panel-header button",
  player = ".html5-video-player",
  // Mobile
  mobileQualityDropdown = "select[id^=player-quality-dropdown]",
  mobileQualityDropdownWrapper = ".player-quality-settings",
  mobileMenuButton = ".mobile-topbar-header-content ytm-menu button",
  mobileOption = "div[role=dialog] ytm-menu-item",
  mobileOkButton = ".dialog-buttons [class*=material-button-button]"
}

export function getVisibleElement<T extends HTMLElement>(elementName: SELECTORS): T {
  const elements = [...document.querySelectorAll(elementName)] as T[];
  return elements.find(isElementVisible);
}

export async function getElementByMutationObserver(selector: SELECTORS, isVisible = true): Promise<HTMLElement> {
  return new Promise(resolve => {
    new MutationObserver((_, observer) => {
      const element = isVisible ? getVisibleElement(selector) : document.querySelector<HTMLElement>(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    }).observe(document, OBSERVER_OPTIONS);
  });
}

export function addStorageListener(): void {
  const prepareFunc =
    location.hostname === "m.youtube.com" ? prepareToChangeQualityOnMobile : prepareToChangeQualityOnDesktop;
  STORAGE.watch({
    async isExtensionEnabled({ newValue: isExtEnabled }: { newValue: boolean }) {
      window.ythdExtEnabled = isExtEnabled;
      const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
      if (isExtEnabled && elVideo) {
        await prepareFunc();
      }
    },
    async qualities({ newValue: qualities }: { newValue: QualityFpsPreferences }) {
      window.ythdLastQualityClicked = null;
      window.ythdLastUserQualities = qualities;
      await prepareFunc();
    }
  });
}

// eslint-disable-next-line @typescript-eslint/ban-types
export async function addGlobalEventListener(addTemporaryBodyListener: () => void): Promise<void> {
  // Fires when navigating to another page
  const elTitle =
    document.documentElement.querySelector(SELECTORS.title) ||
    (await getElementByMutationObserver(SELECTORS.title, false));
  new MutationObserver(addTemporaryBodyListener).observe(elTitle, OBSERVER_OPTIONS);
}

function isElementVisible(element: HTMLElement): boolean {
  return element?.offsetWidth > 0 && element?.offsetHeight > 0;
}

export function getFpsFromRange(qualities: QualityFpsPreferences, fpsToCheck: VideoFPS): VideoFPS {
  const fpsList = Object.keys(qualities)
    .map(Number)
    .sort((a, b) => b - a) as VideoFPS[];
  while (fpsList.length > 1) {
    const fpsCurrent: VideoFPS = fpsList.pop();
    if (fpsToCheck <= fpsCurrent) {
      return fpsCurrent;
    }
  }
  return fpsList[0];
}

export async function getPreferredQualities(): Promise<QualityFpsPreferences> {
  return getStorage({
    area: "local",
    key: "qualities",
    fallback: initial.qualities,
    updateWindowKey: "ythdLastUserQualities"
  });
}

export function getIQuality(
  qualitiesCurrent: VideoQuality[] | YouTubeLabel[],
  qualityPreferred: VideoQuality | YouTubeLabel
): number {
  return qualitiesCurrent.findIndex((quality: VideoQuality | YouTubeLabel) => quality === qualityPreferred);
}
