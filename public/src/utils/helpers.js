import * as cardDataManage from "../configs/card-data-manage";
import * as constants from "../configs/constants";

/**
 * Generates a random 6-digit number string.
 * @returns {string} A 6-digit string.
 */
export function generateShortId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
         * Converts bytes to a human-readable string.
         * @param {number} bytes 
         * @returns {string}
         */
        export const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'kB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

export function isExceedingViewport(elementBound) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  // Check if the element is outside of the viewport on any side
  return (
    elementBound.top >= viewportHeight ||
    elementBound.left >= viewportWidth ||
    elementBound.bottom <= 0 ||
    elementBound.right <= 0
  );
}

/**
 * @param {object} options {excludedNulls: boolean, renderValues: boolean}
*/
export function hyperflatArray(data, options = null) {
  const excludedNulls = options && options.excludedNulls === true;
  const renderValues = options && options.renderValues === true;
  const  pracArray = [data];
  var  targetIdx = pracArray.findIndex(e => Array.isArray(e));
  while (targetIdx >= 0) {
    const newChildren = [...pracArray[targetIdx]];
    if (renderValues) {
      var valuableIdx = newChildren.findIndex(nc => cardDataManage.isMatter(nc) && nc.key && nc.value);
      while (valuableIdx >= 0) {
        const extractedVal = cardDataManage.getReturnValue("*", newChildren[valuableIdx], null, "value");
        const replacedChild = cardDataManage.isMatter(extractedVal) ? [extractedVal] : [];
        newChildren.splice(valuableIdx, 1, ...replacedChild);
        valuableIdx = newChildren.findIndex(nc => nc.key && nc.value);
      }
    }

    pracArray.splice(targetIdx, 1, ...newChildren);
    targetIdx = pracArray.findIndex(e => Array.isArray(e));
  }
  if (excludedNulls)
    return pracArray.filter(r => cardDataManage.isMatter(r));
  return pracArray;
}

export function isPartiallyInViewport(elementBound) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  // The element is visible if its top is above the bottom of the viewport AND
  // its bottom is below the top of the viewport.
  // The same logic applies to horizontal visibility.
  const isVerticallyVisible = elementBound.top < viewportHeight && elementBound.bottom > 0;
  const isHorizontallyVisible = elementBound.left < viewportWidth && elementBound.right > 0;

  return isVerticallyVisible && isHorizontallyVisible;
}

//Colors
export function setColorOpacity(colorHex6, opacity255) {
  return (colorHex6.startsWith('#') ? '' : '#') + colorHex6 + to2DigitHex(opacity255);
}

export function setColorPart(colorHex, r255 = null, g255 = null, b255 = null, a100 = null) {
  const pracColor = colorHex.startsWith('#') ? colorHex.substring(1) : colorHex;
  var rPart = (pracColor[0] ?? '0') + (pracColor[1] ?? '0');
  if (r255) rPart = to2DigitHex(r255);
  var gPart = (pracColor[2] ?? '0') + (pracColor[3] ?? '0');
  if (g255) gPart = to2DigitHex(g255);
  var bPart = (pracColor[4] ?? '0') + (pracColor[5] ?? '0');
  if (b255) bPart = to2DigitHex(b255);
  var aPart = (pracColor[6] ?? '') + (pracColor[7] ?? '');
  if (a100) aPart = to2DigitHex(Math.round(a100 / 100 * 255));
  return `#${rPart}${gPart}${bPart}${aPart}`;
}

export function to2DigitHex(colorValue) {
  if (typeof colorValue !== 'number' || isNaN(colorValue)) {
    throw new Error("Input must be a valid number.");
  }
  if (colorValue < 0 || colorValue > 255) {
    throw new Error("Color value must be between 0 and 255.");
  }
  return colorValue.toString(16).padStart(2, '0');
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function extractMilliseconds(ms) {
  const result = [];
  let remainingValue = ms;
  for (let i = 0; i < constants.timeConvertionUnits.length; i++) {
    if (remainingValue <= 0) break;
    const curUnit = constants.timeConvertionUnits[i];
    let  dr = remainingValue / curUnit.value;
    if (dr >= 1) {
      dr = Math.floor(dr);
      remainingValue -= dr * curUnit.value;
    }
    if (dr >= 1 || !constants.timeConvertionUnits[i + 1]) {
      result.push({
        unit: curUnit,
        value: dr
      });
      if (!constants.timeConvertionUnits[i + 1]) i--;
      if (dr < 1) break;
    }
  }
  return result;
}
