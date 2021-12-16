"use strict";

import { getStorage, resizePlayerIfNeeded } from "./yt-auto-hd-utilities";
import { initial, qualities } from "./yt-auto-hd-setup";
import { gObserverOptions } from "./yt-auto-hd-content-script-initialize";

window.ythdLastUserQualities = { ...initial.qualities };

let gObserverMenuOpen;

export async function prepareToChangeQuality() {
  changeQualityWhenReady();

  if (!isSettingsMenuOpen()) {
    toggleSettingsMenu();
  }
}

function changeQualityWhenReady() {
  if (!gObserverMenuOpen) {
    gObserverMenuOpen = new MutationObserver((_, observer) => {
      if (getElement("optionQuality") || getElement("adSkipIn") || getElement("adSkipOut")) {
        observer.disconnect();
        attemptingToChangeQuality();
      }
    });
  }

  gObserverMenuOpen.observe(document, gObserverOptions);
}

async function attemptingToChangeQuality() {
  const elVideo = getElement("video");
  if (!getIsLastOptionQuality() || (!getIsQualityAuto() && !window.ythdLastQualityClicked)) {
    toggleSettingsMenu();
    elVideo.addEventListener("canplay", prepareToChangeQuality, {
      once: true
    });
    return;
  }
  openQualityMenu();

  await changeQuality(window.ythdLastQualityClicked);
  const elButtonSettings = getElement("buttonSettings");
  if (document.activeElement === elButtonSettings) {
    elButtonSettings.blur();
  }
  elVideo.focus();
}

async function changeQuality(qualityCustom) {
  const fpsCurrent = getFPS();
  const qualitiesAvailable = getCurrentQualities();
  const elQualities = getCurrentQualityElements();
  const qualitiesUser = await getUserQualities();

  const fps = getFpsFromRange(qualitiesUser, fpsCurrent);
  const i = getIQuality(qualitiesAvailable, qualityCustom || qualitiesUser[fps]);

  const isQualityExists = i > -1;
  if (isQualityExists) {
    elQualities[i].click();
  } else if (getIsQualityLower(elQualities[0], qualitiesUser[fps])) {
    elQualities[0].click();
  } else {
    const iClosestQuality = qualitiesAvailable.findIndex(quality => quality <= qualitiesUser[fps]);
    const isClosestQualityFound = iClosestQuality > -1;
    if (isClosestQualityFound) {
      elQualities[iClosestQuality].click();
    } else {
      toggleSettingsMenu();
    }
  }
}

/**
 * @param {string} elementName
 * @param {boolean} isGetAll
 * @returns {HTMLElement[]|HTMLElement}
 */
export function getElement(elementName, { isGetAll = false } = {}) {
  const selectors = {
    buttonSettings: ".ytp-settings-button",
    optionQuality: ".ytp-menuitem:last-child",
    menuOption: ".ytp-menuitem",
    player: ".html5-video-player",
    adSkipIn: ".ytp-ad-preview-text",
    adSkipNow: ".ytp-ad-skip-button-text",
    video: "video"
  };

  if (isGetAll) {
    return [...document.querySelectorAll(selectors[elementName])].filter(isElementVisible);
  }

  const elements = [...document.querySelectorAll(selectors[elementName])];
  return elements.find(isElementVisible);
}

/**
 * @param {HTMLElement} elQuality
 * @param {number} qualityUser
 * @returns {boolean}
 */
function getIsQualityLower(elQuality, qualityUser) {
  const qualityVideo = parseInt(elQuality.textContent);
  return qualityVideo < qualityUser;
}

/**
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function isElementVisible(element) {
  return element?.offsetWidth > 0 && element?.offsetHeight > 0;
}

/**
 * @returns {string|undefined}
 */
function isSettingsMenuOpen() {
  const elButtonSettings = getElement("buttonSettings");
  return elButtonSettings?.ariaExpanded;
}

/**
 * @returns {boolean}
 */
function getIsLastOptionQuality() {
  const elOptionInSettings = getElement("optionQuality");
  if (!elOptionInSettings) {
    return false;
  }

  const selQualityName = ".ytp-menuitem-content";
  const elQualityName = elOptionInSettings.querySelector(selQualityName);

  // If the video is a channel trailer, the last option is initially the speed one,
  // and the speed setting can only be a single digit
  const matchNumber = elQualityName?.textContent?.match(/\d+/);
  if (!matchNumber) {
    return false;
  }
  const numberString = matchNumber[0];
  const minQualityCharLength = 3; // e.g. 3 characters in 720p
  return numberString.length >= minQualityCharLength;
}

export function getIsQualityAuto() {
  return isNaN(parseInt(window.ythdLastQualityClicked));
}

function toggleSettingsMenu() {
  const elButtonSettings = getElement("buttonSettings");
  elButtonSettings?.click();
}

function openQualityMenu() {
  const elSettingQuality = getElement("optionQuality");
  elSettingQuality.click();
}

/**
 * @param {object} qualities
 * @param {number} fpsToCheck
 * @returns {number}
 */
function getFpsFromRange(qualities, fpsToCheck) {
  const fpsList = Object.keys(qualities)
    .map(Number)
    .sort((a, b) => b - a);
  while (fpsList.length > 1) {
    const fpsCurrent = fpsList.pop();
    if (fpsToCheck <= fpsCurrent) {
      return fpsCurrent;
    }
  }
  return fpsList[0];
}

/**
 * @returns {Promise<Object>}
 */
export async function getUserQualities() {
  try {
    const userQualities = (await getStorage("local", "qualities")) ?? {};
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

/**
 * @returns {number}
 */
function getFPS() {
  const elQualities = getCurrentQualityElements();
  const labelQuality = elQualities[0]?.textContent;
  if (!labelQuality) {
    return 30;
  }
  const fpsMatch = labelQuality.match(/[ps](\d+)/);
  return fpsMatch ? Number(fpsMatch[1]) : 30;
}

/**
 * @returns {number[]}
 */
function getCurrentQualities() {
  const elQualities = getCurrentQualityElements();
  return elQualities.map(convertQualityToNumber);
}

/**
 * @returns {HTMLElement[]}
 */
function getCurrentQualityElements() {
  return getElement("menuOption", { isGetAll: true }).filter(isQualityElement);
}

/**
 * @returns {number}
 */
function convertQualityToNumber(elQuality) {
  return parseInt(elQuality.textContent);
}

/**
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function isQualityElement(element) {
  const isQuality = Boolean(element.textContent.match(/\d/));
  const isHasChildren = element.children.length > 1;
  return isQuality && !isHasChildren;
}

/**
 * @param {number[]} qualitiesCurrent
 * @param {number} qualityUser
 * @returns {Number}
 */
function getIQuality(qualitiesCurrent, qualityUser) {
  return qualitiesCurrent.findIndex(elQuality => elQuality === qualityUser);
}

chrome.storage.onChanged.addListener(async ({ qualities, autoResize, size }) => {
  if (qualities) {
    window.ythdLastQualityClicked = null;
    window.ythdLastUserQualities = { ...qualities };
    prepareToChangeQuality();
    return;
  }

  if (autoResize) {
    resizePlayerIfNeeded();
    return;
  }

  if (size !== undefined) {
    const autoResize = (await getStorage("sync", "autoResize")) ?? initial.autoResize;
    if (autoResize) {
      resizePlayerIfNeeded({ size: size.newValue });
    }
  }
});
