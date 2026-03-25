import { fpsSupported, initial } from "./ythd-defaults";
import type { EnhancedBitrateFpsPreferences, QualityFpsPreferences } from "./ythd-types";
import { storage, type StorageArea } from "#imports";

export const OBSERVER_OPTIONS = Object.freeze<MutationObserverInit>({ childList: true, subtree: true });
window.ythdLastUserQualities = { ...initial.qualities };
window.ythdLastUserEnhancedBitrates = { ...initial.isEnhancedBitrates };
window.ythdIsUseSuperResolution = initial.isUseSuperResolution;

export async function getStorage<T>({
  area,
  key,
  fallback
}: {
  area: StorageArea;
  key: string;
  fallback: T;
}) {
  try {
    return await storage.getItem<T>(`${area}:${key}`, { fallback });
  } catch {
    return fallback;
  }
}

export async function getIsExtensionEnabled(fallback: boolean = initial.isExtensionEnabled) {
  return getStorage({
    area: "local",
    key: "isExtensionEnabled",
    fallback
  });
}

export function getI18n(id: Parameters<typeof browser.i18n.getMessage>[0], backup = "") {
  return id && browser.i18n.getMessage(id) || backup;
}

export enum SELECTORS {
  title = "title",
  video = "video",
  buttonSettings = ".ytp-settings-button",
  sizeToggle = ".ytp-size-button#original-size, .ytp-size-button", // .ytp-size-button#original-size is to avoid a collision with https://chromewebstore.google.com/detail/youtube-windowed-fullscre/gkkmiofalnjagdcjheckamobghglpdpm
  optionQuality = ".ytp-settings-menu[data-layer] .ytp-menuitem:last-child",
  menuOption = ".ytp-settings-menu[data-layer] .ytp-menuitem",
  menuOptionContent = ".ytp-menuitem-content",
  panelHeaderBack = ".ytp-panel-header button",
  player = ".html5-video-player:not(#inline-preview-player)",
  channelTrailerContainer = "ytd-channel-video-player-renderer",
  donationInjectParent = "ytd-comments",
  // Premium
  labelPremium = ".ytp-premium-label"
}

export function getPlayerDiv<T extends HTMLDivElement = HTMLDivElement>(elVideo: HTMLVideoElement): T | null {
  return elVideo.closest<T>(SELECTORS.player);
}

export function getVisibleElement<T extends HTMLElement>(elementName: SELECTORS): T | undefined {
  const elements = [...document.querySelectorAll<T>(elementName)];
  return elements.find(isElementVisible);
}

export async function getElementByMutationObserver<T extends HTMLElement>(
  selector: SELECTORS,
  isVisible = true
) {
  return new Promise<T>(resolve => {
    new MutationObserver((_, observer) => {
      const element = isVisible ? getVisibleElement<T>(selector) : document.querySelector<T>(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    }).observe(document, OBSERVER_OPTIONS);
  });
}

export async function addGlobalEventListener(addTemporaryBodyListener: () => void) {
  // Fires when navigating to another page
  const elTitle =
    document.documentElement.querySelector(SELECTORS.title) ||
    await getElementByMutationObserver<HTMLTitleElement>(SELECTORS.title, false);
  const observer = new MutationObserver(addTemporaryBodyListener);
  observer.observe(elTitle, OBSERVER_OPTIONS);
}

function isElementVisible(element: HTMLElement) {
  return element?.offsetWidth > 0 && element?.offsetHeight > 0;
}

export function getFpsFromRange(
  qualities: QualityFpsPreferences | EnhancedBitrateFpsPreferences,
  fpsToCheck: number
) {
  const fpsList = fpsSupported.filter(fps => fps.toString() in qualities).sort((first, second) => second - first);
  return fpsList.find(fps => fps <= fpsToCheck) ?? fpsList[fpsList.length - 1] ?? fpsSupported[2];
}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (_: unknown, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export function getUncircularJson(obj: Record<string, unknown> | null) {
  if (!obj) {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj, getCircularReplacer()));
}
