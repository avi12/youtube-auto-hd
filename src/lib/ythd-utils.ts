import { storage, type StorageArea } from "wxt/storage";
import type {
  EnhancedBitrateFpsPreferences,
  EnhancedBitratePreferences,
  QualityFpsPreferences,
  VideoFPS
} from "./types";
import { initial } from "./ythd-setup";
import { prepareToChangeQualityOnDesktop } from "@/entrypoints/desktop.content/functions-desktop";
import { getValue } from "@/lib/shared-utils";

export const OBSERVER_OPTIONS: MutationObserverInit = Object.freeze({ childList: true, subtree: true });
window.ythdLastUserQualities = { ...initial.qualities };

export async function getStorage<T>({
  area,
  key,
  fallback,
  updateWindowKey
}: {
  area: StorageArea;
  key: string;
  fallback: T;
  updateWindowKey: string;
}): Promise<T> {
  let value: T;
  try {
    value = getValue(await storage.getItem<T>(`${area}:${key}`, { fallback }));
  } catch {
    value = fallback;
  }
  // @ts-expect-error Incompatible types
  if (typeof window[updateWindowKey] !== "object") {
    // @ts-expect-error Incompatible types
    window[updateWindowKey] = value;
  } else {
    // @ts-expect-error Incompatible types
    window[updateWindowKey] = { ...fallback, ...value };
  }
  return value;
}

export async function getIsExtensionEnabled(): Promise<boolean> {
  return getStorage({
    area: "local",
    key: "isExtensionEnabled",
    fallback: initial.isExtensionEnabled,
    updateWindowKey: "ythdExtEnabled"
  });
}

export function getI18n(id: string, backup = ""): string {
  return (id && browser.i18n.getMessage(id)) || backup;
}

export enum SELECTORS {
  title = "title",
  video = "video",
  buttonSettings = ".ytp-settings-button",
  pathSizeToggle = `path[d*="m 28,"], path[d*="m 26,"]`,
  optionQuality = ".ytp-settings-menu[data-layer] .ytp-menuitem:last-child",
  menuOption = ".ytp-settings-menu[data-layer] .ytp-menuitem",
  menuOptionContent = ".ytp-menuitem-content",
  panelHeaderBack = ".ytp-panel-header button",
  player = ".html5-video-player:not(#inline-preview-player)",
  donationInjectParent = "ytd-comments",
  // Premium
  labelPremium = ".ytp-premium-label"
}

export function getVisibleElement<T extends HTMLElement>(elementName: SELECTORS): T {
  const elements = [...document.querySelectorAll(elementName)] as Array<T>;
  return elements.find(isElementVisible) as T;
}

export async function getElementByMutationObserver<T extends HTMLElement>(
  selector: SELECTORS,
  isVisible = true
): Promise<T> {
  return new Promise(resolve => {
    new MutationObserver((_, observer) => {
      const element = isVisible ? getVisibleElement<T>(selector) : document.querySelector<T>(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    }).observe(document, OBSERVER_OPTIONS);
  });
}

export function addStorageListener(): void {
  storage.watch<boolean>("local:isExtensionEnabled", async isExtEnabled => {
    window.ythdExtEnabled = isExtEnabled as boolean;
    const elVideo = getVisibleElement<HTMLVideoElement>(SELECTORS.video);
    if (!elVideo) {
      return;
    }
    if (!isExtEnabled) {
      return;
    }
    await prepareToChangeQualityOnDesktop();
  });

  storage.watch<QualityFpsPreferences>("local:qualities", async qualities => {
    window.ythdLastQualityClicked = null;
    window.ythdLastUserQualities = qualities;
    await prepareToChangeQualityOnDesktop();
  });

  storage.watch<EnhancedBitratePreferences>("local:isEnhancedBitrates", async isEnhancedBitrates => {
    window.ythdLastEnhancedBitrateClicked = {};
    window.ythdLastUserEnhancedBitrates = isEnhancedBitrates;
    await prepareToChangeQualityOnDesktop();
  });
}

export async function addGlobalEventListener(addTemporaryBodyListener: () => void): Promise<MutationObserver> {
  // Fires when navigating to another page
  const elTitle =
    document.documentElement.querySelector(SELECTORS.title) ||
    (await getElementByMutationObserver<HTMLTitleElement>(SELECTORS.title, false));
  const observer = new MutationObserver(addTemporaryBodyListener);
  observer.observe(elTitle, OBSERVER_OPTIONS);
  return observer;
}

function isElementVisible(element: HTMLElement): boolean {
  return element?.offsetWidth > 0 && element?.offsetHeight > 0;
}

export function getFpsFromRange(
  qualities: QualityFpsPreferences | EnhancedBitrateFpsPreferences,
  fpsToCheck: number
): VideoFPS {
  const fpsList = Object.keys(qualities)
    .map(fps => parseInt(fps))
    .sort((a, b) => b - a) as Array<VideoFPS>;
  return fpsList.find(fps => fps <= fpsToCheck) || (fpsList.at(-1) as VideoFPS);
}
