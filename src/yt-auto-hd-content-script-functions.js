"use strict";

import {
  getIsFewerQualityValues,
  getStorage,
  resizePlayerIfNeeded
} from "./yt-auto-hd-utilities";
import { initial, qualities } from "./yt-auto-hd-setup";

chrome.storage.onChanged.addListener(updatePlayer);

export async function prepareToChangeQuality() {
  if (!isSettingsMenuOpen()) {
    toggleSettingsMenu();
  }
  const elVideo = getElement("video");
  if (!isLastOptionQuality()) {
    toggleSettingsMenu();
    elVideo.addEventListener("canplay", prepareToChangeQuality, {
      once: true
    });
    return;
  }
  openQualityMenu();
  await changeQuality();
  const elButtonSettings = getElement("buttonSettings");
  if (document.activeElement === elButtonSettings) {
    elButtonSettings.blur();
  }
  elVideo.focus();
  return true;
}

async function changeQuality() {
  const fpsCurrent = getFPS();
  const qualitiesCurrent = getCurrentQualities();
  const elQualities = getCurrentQualityElements();
  let qualitiesUser = await getUserQualities();
  if (getIsFewerQualityValues(qualitiesUser, initial.qualities)) {
    qualitiesUser = initial.qualities;
  }
  const fps = getFpsFromRange(qualitiesUser, fpsCurrent);
  const i = getQualityIndex(qualitiesCurrent, qualitiesUser[fps]);
  // Sometimes the qualities list is empty
  // Though, this if statement doesn't affect
  // the extension's functionality - it's just
  // to prevent undefined-related errors
  if (elQualities.length === 0) {
    return;
  }
  const isQualityExists = i > -1;
  if (isQualityExists) {
    elQualities[i].click();
  } else if (getIsQualityLower(elQualities[0], qualitiesUser[fps])) {
    elQualities[0].click();
  } else {
    const iClosestQuality = qualitiesCurrent.findIndex(
      quality => quality <= qualitiesUser[fps]
    );
    const isClosestQualityFound = iClosestQuality > -1;
    if (isClosestQualityFound) {
      elQualities[iClosestQuality].click();
    } else {
      toggleSettingsMenu();
    }
  }
}

/**
 * @returns {HTMLElement[]|HTMLElement}
 */
function getElement(elementName, { isGetAll = false } = {}) {
  const selectors = {
    buttonSettings: ".ytp-settings-button",
    optionQuality: ".ytp-menuitem:last-child",
    menuOption: ".ytp-menuitem",
    video: "video"
  };

  if (isGetAll) {
    return [...document.querySelectorAll(selectors[elementName])];
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

export { getElement };

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
 * @returns {RegExpMatchArray|boolean}
 */
function isLastOptionQuality() {
  const elOptionInSettings = getElement("optionQuality");
  try {
    return elOptionInSettings.textContent.match(/\d{3,4}/);
  } catch {
    return false;
  }
}

function toggleSettingsMenu() {
  const elButtonSettings = getElement("buttonSettings");
  elButtonSettings.click();
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
async function getUserQualities() {
  let qualities = (await getStorage("local", "qualities")) ?? {};
  if (getIsFewerQualityValues(qualities, initial.qualities)) {
    qualities = { ...qualities, ...initial.qualities };
  }
  return qualities;
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
 * @param {Number} qualityUser
 * @returns {Number}
 */
function getQualityIndex(qualitiesCurrent, qualityUser) {
  return qualitiesCurrent.findIndex(elQuality => elQuality === qualityUser);
}

async function updatePlayer({ qualities, autoResize, size }) {
  if (qualities) {
    prepareToChangeQuality();
    return;
  }

  if (autoResize) {
    resizePlayerIfNeeded();
    return;
  }

  if (size !== undefined) {
    const autoResize =
      (await getStorage("sync", "autoResize")) ?? initial.autoResize;
    if (autoResize) {
      resizePlayerIfNeeded({ size: size.newValue });
    }
  }
}
