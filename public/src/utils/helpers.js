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

//Colors
export class ColorHSL {
  h;
  s;
  l;
  a = 1;
  /***
   * @param {number} h Hue: 0 - 360
   * @param {number} s Saturation: 0 - 100
   * @param {number} l Lightness: 0 - 100
   * @param {number} a Alpha: 0 - 1 
   */
  constructor (h, s, l, a) {
    this.h = h ?? 0;
    this.s = s ?? 0;
    this.l = l ?? 0;
    this.a = a ?? 1;
  }

    /**
   * Converts a hexadecimal color code (e.g., "#RRGGBB", "RRGGBB", "#RRGGBBAA", "RRGGBBAA")
   * to an HSLA color string.
   *
   * @param {string} hex The hex color code string.
   * @returns {ColorHSL} The HSLa class from the Hex Color
   */
  fromHex(hex) {
      // 1. Clean the input: Remove leading/trailing whitespace and the '#' prefix.
      let hexValue = hex.trim(); 
      hexValue = hexValue.startsWith('#') ? hexValue.slice(1) : hexValue;

      const len = hexValue.length;

      // 2. Handle 3-digit shorthand (e.g., #3f4 becomes #33ff44)
      if (len === 3) {
          hexValue = hexValue.split('').map(char => char + char).join('');
      }

      // 3. Initialize RGB and Alpha variables
      let r = 0, g = 0, b = 0, a = 1;

      // 4. Extract RGB values for 6- or 8-digit hex
      if (hexValue.length >= 6) {
          // Use 0 if parseInt fails (though it shouldn't after trimming)
          r = parseInt(hexValue.substring(0, 2), 16) || 0;
          g = parseInt(hexValue.substring(2, 4), 16) || 0;
          b = parseInt(hexValue.substring(4, 6), 16) || 0;
      } else {
          // If length is < 6 (and not 3, which was handled), default to black/transparent
          this.h = 0; this.s = 0; this.l = 0; this.a = 0;
          return this;
      }

      // 5. Extract Alpha value for 8-digit hex (RGBA)
      if (hexValue.length === 8) {
          a = (parseInt(hexValue.substring(6, 8), 16) || 255) / 255;
      }

      // --- RGB to HSL Conversion ---

      // Normalize RGB to 0-1 range
      const R = r / 255;
      const G = g / 255;
      const B = b / 255;

      const cmax = Math.max(R, G, B);
      const cmin = Math.min(R, G, B);
      const delta = cmax - cmin;
      
      let h = 0; // Hue (0-1)
      let s = 0; // Saturation (0-1)
      let l = (cmax + cmin) / 2; // Lightness (0-1)

      if (delta !== 0) {
          s = l > 0.5 ? delta / (2 - cmax - cmin) : delta / (cmax + cmin);
          
          // Hue calculation based on which component is max
          switch (cmax) {
              case R: h = (G - B) / delta + (G < B ? 6 : 0); break;
              case G: h = (B - R) / delta + 2; break;
              case B: h = (R - G) / delta + 4; break;
          }
          h /= 6; // Normalize h to 0-1
      }

      // Final HSL(A) values (Hue in degrees, Saturation/Lightness in percent)
      const H_deg = Math.round(h * 360);
      const S_perc = Math.round(s * 100);
      const L_perc = Math.round(l * 100);

      // 6. Assign results to the object properties
      this.h = H_deg;
      this.s = S_perc;
      this.l = L_perc;
      this.a = a;
      
      return this;
  }

  /***
   * @param {number} sPercent The new value of the S part, in percent
   * @returns {ColorHSL} The new HSL class by changing the S value
   */
  setS(sPercent) {
    const newS = Math.min(100, Math.max(0, sPercent));
    return new ColorHSL(this.h, newS, this.l, this.a);
  }

  /***
   * @param {number} lPercent The new value of the L part, in percent
   * @returns {ColorHSL} The new HSL class by changing the L value
   */
  setL(lPercent) {
    const newL = Math.min(100, Math.max(0, lPercent));
    return new ColorHSL(this.h, this.s, newL, this.a);
  }

  /***
   * @param {number} sPercent The altering value of the S part, in percent (+/-)
   * @returns {ColorHSL} The new HSL class by altering the S value
   */
  modifyS(sPercent) {
    const newS = Math.min(100, Math.max(0, this.s + sPercent));
    return new ColorHSL(this.h, newS, this.l, this.a);
  }

  /***
   * @param {number} lPercent The altering value of the L part, in percent (+/-)
   * @returns {ColorHSL} The new HSL class by altering the L value
   */
  modifyL(lPercent) {
    const newL = Math.min(100, Math.max(0, this.l + lPercent));
    return new ColorHSL(this.h, this.s, newL, this.a);
  }

  getHSLString() {
    return `hsl(${this.h}, ${this.s}%, ${this.l}%${this.a < 1 ? ` / ${this.a}` : ""})`;
  }

  /**
 * Converts HSL(A) color components to a Hexadecimal string (#RRGGBB or #RRGGBBAA).
 * @returns {string} The hex color string (e.g., "#31f54e" or "#31f54e4d").
 */
  getHex() {
      // 1. Normalize H, S, L to 0-1 range
      let H = this.h / 360;
      let S = this.s / 100;
      let L = this.l / 100;

      let r, g, b;

      // Helper function for the hue-based RGB component calculation
      const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
      };

      if (S === 0) {
          // Monochromatic (achromatic) color: R, G, B are equal to L
          r = g = b = L;
      } else {
          // Calculate intermediate values p and q (used for saturation adjustment)
          const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
          const p = 2 * L - q;
          
          // Calculate R, G, B using the helper and hue offsets
          r = hue2rgb(p, q, H + 1 / 3);
          g = hue2rgb(p, q, H);
          b = hue2rgb(p, q, H - 1 / 3);
      }
      
      // 2. Scale R, G, B from 0-1 to 0-255
      const R_255 = r * 255;
      const G_255 = g * 255;
      const B_255 = b * 255;

      // 3. Convert components to hex strings
      const rHex = componentToHex(R_255);
      const gHex = componentToHex(G_255);
      const bHex = componentToHex(B_255);
      
      let hexResult = `#${rHex}${gHex}${bHex}`;
      
      // 4. Handle Alpha: If alpha is not fully opaque, append the AA component
      if (this.a < 1) {
          const A_255 = this.a * 255;
          const aHex = componentToHex(A_255);
          hexResult += aHex;
      }

      return hexResult;
  }
}

/**
 * Helper function to convert a value from 0-255 to a padded 2-digit hex string.
 * @param {number} c Component value (0-255).
 * @returns {string} Two-digit hex string.
 */
function componentToHex(c) {
    // Ensure the value is rounded and clamped between 0 and 255
    const value = Math.min(255, Math.max(0, Math.round(c)));
    const hex = value.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

/***
 * @param {HTMLElement} html Requested HTML Element
 * @return {string} Color of the closest parent in Hex
 */
export function getUpperColor(html) {
  let baseColor = undefined;
  let current = html;
  while (current && !baseColor) {
    if (current.dataset.baseColor) {
      baseColor = current.dataset.baseColor;
      break;
    }
    current = current.parentElement ?? undefined;
  }
  return baseColor ?? "#ffffff";
}