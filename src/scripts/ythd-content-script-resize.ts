"use strict";

import { initial } from "../shared-scripts/ythd-setup";
import { Selectors } from "../shared-scripts/ythd-utilities";

window.ythdPlayerSize = initial.size;
window.ythdPlayerAutoResize = initial.isResizeVideo;

function getCurrentSize(): number {
  const sizeCurrentMatch = document.cookie.match(/wide=([10])/);
  return sizeCurrentMatch ? Number(sizeCurrentMatch[1]) : 0;
}

export async function resizePlayerIfNeeded(): Promise<void> {
  const elSizePath = document.querySelector(Selectors.pathSizeToggle) as SVGPathElement;
  if (!elSizePath) {
    return;
  }

  const selSizeButtonOld = "button";
  const selSizeButtonNew = Selectors.menuOption;
  const elSizeToggle = elSizePath.closest<HTMLButtonElement | HTMLDivElement>(
    `${selSizeButtonOld}, ${selSizeButtonNew}`
  );

  if (!window.ythdPlayerAutoResize) {
    return;
  }

  const sizePreferred = window.ythdPlayerSize;
  if (getCurrentSize() === sizePreferred) {
    return;
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (getCurrentSize() === sizePreferred) {
      break;
    }
    elSizeToggle.click();
  }
}
