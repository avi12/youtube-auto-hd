"use strict";

import { getStorage, Selectors } from "../shared-scripts/ythd-utilities";
import { initial } from "../shared-scripts/ythd-setup";

function getCurrentSize() {
  const sizeCurrentMatch = document.cookie.match(/wide=([10])/);
  return sizeCurrentMatch ? Number(sizeCurrentMatch[1]) : 0;
}

export async function resizePlayerIfNeeded(sizeNew?: number) {
  const elSizePath = document.querySelector(Selectors.pathSizeToggle) as SVGPathElement;
  if (!elSizePath) {
    return;
  }

  const selSizeButtonOld = "button";
  const selSizeButtonNew = Selectors.menuOption;
  const elSizeToggle = elSizePath.closest(`${selSizeButtonOld}, ${selSizeButtonNew}`) as HTMLDivElement;

  const isAutoResize = (await getStorage("sync", "autoResize")) ?? initial.isResizeVideo;
  if (!isAutoResize) {
    return;
  }

  const sizePreferred = sizeNew || ((await getStorage("sync", "size")) ?? initial.size);
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
