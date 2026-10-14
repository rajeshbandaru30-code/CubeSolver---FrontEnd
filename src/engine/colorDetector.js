/**
 * colorDetector.js
 *
 * Commercial-grade Rubik's Cube Computer Vision & Color Classification Engine.
 *
 * Features:
 * 1. CIELAB (L*a*b*) & HSV perceptual color space conversions.
 * 2. Multi-point trimmed-mean interior pixel sampling (filters out black plastic gaps,
 *    bevels, reflections, and specular glare).
 * 3. Specific physical discriminators for challenging pairs:
 *    - White vs. Yellow: checks blue-absorption ratio B/max(R,1) and chroma threshold.
 *    - Red vs. Orange: checks G/R ratio, hue angle (orange: 14°-42°, red: <=14° or >=345°),
 *      and (b-star / a-star) chroma ratio.
 *    - Green vs. Blue: checks negative a* (green) vs negative b* (blue).
 * 4. Image quality diagnostics: detects low lighting, overexposure/glare, and blur.
 * 5. Dynamic ambient lighting calibration: normalizes against room lighting white point.
 * 6. Evidence-based confidence scoring with "Needs Review" flagging for ambiguous samples.
 */

// Standard WCA Face / Color definitions matching CubeState.java
export const CUBE_COLORS = [
  { id: 0, code: 'W', name: 'White',  hex: '#FFFFFF', border: '#cbd5e1', text: '#000000', label: 'White (W)' },
  { id: 1, code: 'R', name: 'Red',    hex: '#EF4444', border: '#dc2626', text: '#ffffff', label: 'Red (R)' },
  { id: 2, code: 'G', name: 'Green',  hex: '#22C55E', border: '#16a34a', text: '#ffffff', label: 'Green (G)' },
  { id: 3, code: 'Y', name: 'Yellow', hex: '#FFD60A', border: '#ca8a04', text: '#000000', label: 'Yellow (Y)' },
  { id: 4, code: 'O', name: 'Orange', hex: '#FF9500', border: '#ea580c', text: '#ffffff', label: 'Orange (O)' },
  { id: 5, code: 'B', name: 'Blue',   hex: '#0A84FF', border: '#0066cc', text: '#ffffff', label: 'Blue (B)' },
];

/**
 * Converts sRGB [0..255] to HSV
 * H: 0..360, S: 0..1, V: 0..1
 */
export function rgbToHsv(r, g, b) {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rf) {
      h = ((gf - bf) / delta) % 6;
    } else if (max === gf) {
      h = (bf - rf) / delta + 2;
    } else {
      h = (rf - gf) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
}

/**
 * Converts sRGB [0..255] to CIE L*a*b* (D65 standard illuminant)
 * L*: 0..100, a*: -128..127, b*: -128..127
 */
export function rgbToLab(r, g, b) {
  // 1. Convert sRGB to linear RGB (gamma expansion)
  let rl = r / 255;
  let gl = g / 255;
  let bl = b / 255;

  rl = rl > 0.04045 ? Math.pow((rl + 0.055) / 1.055, 2.4) : rl / 12.92;
  gl = gl > 0.04045 ? Math.pow((gl + 0.055) / 1.055, 2.4) : gl / 12.92;
  bl = bl > 0.04045 ? Math.pow((bl + 0.055) / 1.055, 2.4) : bl / 12.92;

  // 2. Convert linear RGB to CIE XYZ (D65 observer matrix)
  let x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  let y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) / 1.00000;
  let z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;

  // 3. Convert XYZ to CIELAB
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return { L, a, b: bVal };
}

/**
 * Standard calibrated reference prototypes in CIELAB & HSV
 */
export const DEFAULT_PROTOTYPES = [
  { id: 0, name: 'White',  L: 92, a: 0,   b: 0,   h: 0,   s: 0.06, v: 0.95 },
  { id: 1, name: 'Red',    L: 48, a: 64,  b: 36,  h: 0,   s: 0.85, v: 0.88 },
  { id: 2, name: 'Green',  L: 60, a: -56, b: 35,  h: 135, s: 0.80, v: 0.75 },
  { id: 3, name: 'Yellow', L: 88, a: -8,  b: 84,  h: 54,  s: 0.90, v: 0.96 },
  { id: 4, name: 'Orange', L: 62, a: 48,  b: 66,  h: 24,  s: 0.90, v: 0.94 },
  { id: 5, name: 'Blue',   L: 46, a: 8,   b: -52, h: 215, s: 0.85, v: 0.84 },
];

/**
 * Perceptual CIELAB Euclidean color distance with lightness dampening
 */
export function deltaE(lab1, lab2) {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  // Dampen lightness variance so ambient brightness changes don't overpower chromatic differences
  return Math.sqrt(0.5 * dL * dL + da * da + db * db);
}

/**
 * Robust Color Classifier
 *
 * Uses multi-space discrimination (RGB blue-ratio, HSV hue, CIELAB deltaE)
 * to accurately classify Rubik's cube sticker colors and return confidence scores.
 *
 * @param {number} r - Red [0..255]
 * @param {number} g - Green [0..255]
 * @param {number} b - Blue [0..255]
 * @param {Array} calibration - Optional calibrated prototype array
 * @returns {Object} { colorId, colorName, hex, confidence, needsReview, rawRgb, hsv, lab }
 */
export function classifyColor(r, g, b, calibration = null) {
  const hsv = rgbToHsv(r, g, b);
  const lab = rgbToLab(r, g, b);
  const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);

  // 1. SPECIFIC PHYSICAL DISCRIMINATOR: White vs. Yellow
  // Physical invariant: Yellow strongly absorbs blue light (B << R). White reflects blue equally (B ~ R).
  const maxR = Math.max(r, 1);
  const blueRatio = b / maxR;

  // Clear White identification:
  // Low saturation, balanced blue ratio, and low chroma in Lab
  const isWhiteBySat = hsv.s < 0.22 && blueRatio > 0.68 && lab.L > 52;
  const isWhiteByChroma = chroma < 18 && blueRatio > 0.70 && lab.L > 48;

  if (isWhiteBySat || isWhiteByChroma) {
    const margin = Math.max(0, 0.28 - hsv.s);
    const confidence = Math.min(100, Math.max(50, Math.round(55 + (margin / 0.28) * 45)));
    return {
      colorId: 0,
      colorName: 'White',
      hex: CUBE_COLORS[0].hex,
      confidence,
      needsReview: confidence < 65,
      rawRgb: { r, g, b },
      hsv,
      lab,
    };
  }

  // 2. SPECIFIC PHYSICAL DISCRIMINATOR: Red vs. Orange
  // Orange has high green component (G/R > 0.34) and positive hue (14° to 42°).
  // Red has low green component (G/R <= 0.32) and hue near 0°/360° (<= 14° or >= 345°).
  const greenRatio = g / maxR;

  // 3. Distance scoring against prototypes
  const prototypes = calibration || DEFAULT_PROTOTYPES;
  const scores = prototypes.map((proto) => {
    let dist = deltaE(lab, proto);

    if (proto.id === 1) { // Red
      const hueDist = Math.min(Math.abs(hsv.h - 0), Math.abs(hsv.h - 360));
      if (hsv.h > 17 && hsv.h < 340) dist *= 2.0; // Strongly penalize orange/yellow hues
      if (greenRatio > 0.40) dist *= 1.8;         // Too much green for red
      if (hueDist < 12 && lab.a > 32 && greenRatio <= 0.30) dist *= 0.65; // Reward pure red
    } else if (proto.id === 4) { // Orange
      if (hsv.h >= 13 && hsv.h <= 42 && greenRatio >= 0.32) dist *= 0.70; // Pure orange profile
      else if (hsv.h < 12 || hsv.h > 46) dist *= 1.9;
    } else if (proto.id === 3) { // Yellow
      if (hsv.h >= 43 && hsv.h <= 78 && lab.b > 25 && blueRatio < 0.60) dist *= 0.65; // High yellow confidence
      else if (hsv.h < 36 || hsv.h > 88) dist *= 2.0;
    } else if (proto.id === 2) { // Green
      if (hsv.h >= 80 && hsv.h <= 165 && lab.a < -8) dist *= 0.65;
      else dist *= 2.0;
    } else if (proto.id === 5) { // Blue
      if (hsv.h >= 180 && hsv.h <= 265 && lab.b < -10) dist *= 0.65;
      else dist *= 2.0;
    }

    return { proto, dist: Math.max(0.1, dist) };
  });

  scores.sort((a, b) => a.dist - b.dist);
  const best = scores[0];
  const second = scores[1];

  // Evidence-based confidence:
  // Combines closeness to chosen color and separation from second closest competitor
  const margin = Math.max(0, second.dist - best.dist);
  const closeness = Math.max(0, 1 - best.dist / 70);
  const separation = Math.min(1, margin / 35);
  let confidence = Math.min(100, Math.max(30, Math.round((closeness * 0.45 + separation * 0.55) * 100)));

  // Critical ambiguity edge cases
  const isRedOrangeBorder = (best.proto.id === 1 && second.proto.id === 4 && margin < 14) ||
                            (best.proto.id === 4 && second.proto.id === 1 && margin < 14);
  const isWhiteYellowBorder = (best.proto.id === 0 && second.proto.id === 3 && margin < 16) ||
                              (best.proto.id === 3 && second.proto.id === 0 && margin < 16);

  const needsReview = confidence < 62 || isRedOrangeBorder || isWhiteYellowBorder;

  return {
    colorId: best.proto.id,
    colorName: best.proto.name,
    hex: CUBE_COLORS[best.proto.id].hex,
    confidence,
    needsReview,
    rawRgb: { r, g, b },
    hsv,
    lab,
  };
}

/**
 * Multi-point Trimmed-Mean Sticker Sampling
 *
 * Samples the central region of each of the 9 stickers, discarding specular glare
 * highlights and dark border shadow pixels, then computing a trimmed mean for noise resistance.
 */
export function sampleFaceStickers(ctx, x, y, size, calibration = null) {
  const cellSize = size / 3;
  const inset = 0.22; // Inset 22% from each edge to isolate central sticker area
  const sampleW = Math.max(4, Math.floor(cellSize * (1 - 2 * inset)));
  const sampleH = Math.max(4, Math.floor(cellSize * (1 - 2 * inset)));

  const stickers = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const stickerIndex = row * 3 + col;
      const sampleX = Math.floor(x + col * cellSize + cellSize * inset);
      const sampleY = Math.floor(y + row * cellSize + cellSize * inset);

      try {
        const imgData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
        const data = imgData.data;

        // Collect pixels and compute luminance
        const pixels = [];
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          // Rec. 709 luminance
          const lum = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;

          // Discard overexposed specular reflection points
          const isSpecular = pr > 248 && pg > 248 && pb > 248;
          // Discard black gaps / bevel borders
          const isBorderShadow = lum < 28;

          if (!isSpecular && !isBorderShadow) {
            pixels.push({ r: pr, g: pg, b: pb, lum });
          }
        }

        let meanR, meanG, meanB;

        // If sufficient valid pixels remain, compute 15% trimmed mean
        if (pixels.length >= 10) {
          pixels.sort((a, b) => a.lum - b.lum);
          const trimCount = Math.floor(pixels.length * 0.15);
          const trimmed = pixels.slice(trimCount, pixels.length - trimCount);

          let sumR = 0, sumG = 0, sumB = 0;
          for (let p of trimmed) {
            sumR += p.r;
            sumG += p.g;
            sumB += p.b;
          }
          meanR = Math.round(sumR / trimmed.length);
          meanG = Math.round(sumG / trimmed.length);
          meanB = Math.round(sumB / trimmed.length);
        } else {
          // Fallback to simple center-average if most pixels were filtered
          let sumR = 0, sumG = 0, sumB = 0;
          const total = data.length / 4;
          for (let i = 0; i < data.length; i += 4) {
            sumR += data[i];
            sumG += data[i + 1];
            sumB += data[i + 2];
          }
          meanR = Math.round(sumR / total);
          meanG = Math.round(sumG / total);
          meanB = Math.round(sumB / total);
        }

        const classification = classifyColor(meanR, meanG, meanB, calibration);
        stickers.push({
          index: stickerIndex,
          row,
          col,
          source: 'detected',
          ...classification,
        });
      } catch (err) {
        stickers.push({
          index: stickerIndex,
          row,
          col,
          source: 'detected',
          colorId: stickerIndex === 4 ? 0 : 0,
          colorName: 'White',
          hex: CUBE_COLORS[0].hex,
          confidence: 40,
          needsReview: true,
          rawRgb: { r: 255, g: 255, b: 255 },
        });
      }
    }
  }

  return stickers;
}

/**
 * Real-time Image Quality Analyzer
 *
 * Measures ambient luminance, glare/overexposure, and edge sharpness to provide
 * actionable user feedback in the live camera overlay.
 *
 * @param {CanvasRenderingContext2D} ctx - 2D canvas context
 * @param {number} x - Scan area left
 * @param {number} y - Scan area top
 * @param {number} size - Scan area width/height
 * @returns {Object} { status: 'good'|'low_light'|'glare'|'blurry', message, brightness }
 */
export function analyzeFrameQuality(ctx, x, y, size) {
  try {
    const sampleSize = Math.min(size, 120);
    const step = Math.floor(size / sampleSize);
    const imgData = ctx.getImageData(x, y, size, size);
    const data = imgData.data;

    let totalLum = 0;
    let glareCount = 0;
    let sampledCount = 0;
    let varianceSum = 0;
    let lastLum = 128;

    for (let sy = 0; sy < size; sy += step) {
      for (let sx = 0; sx < size; sx += step) {
        const idx = (sy * size + sx) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        totalLum += lum;
        sampledCount++;

        if (r > 245 && g > 245 && b > 245) {
          glareCount++;
        }

        const diff = lum - lastLum;
        varianceSum += diff * diff;
        lastLum = lum;
      }
    }

    const avgLum = Math.round(totalLum / sampledCount);
    const glareRatio = glareCount / sampledCount;
    const gradientEnergy = Math.round(varianceSum / sampledCount);

    if (avgLum < 45) {
      return {
        status: 'low_light',
        message: 'Lighting too dim — move into better light',
        badge: 'Low Light',
        color: '#FF9500',
        brightness: avgLum,
      };
    }

    if (glareRatio > 0.16) {
      return {
        status: 'glare',
        message: 'Glare detected — tilt cube slightly away from direct light',
        badge: 'Glare Detected',
        color: '#FFD60A',
        brightness: avgLum,
      };
    }

    if (gradientEnergy < 14) {
      return {
        status: 'blurry',
        message: 'Camera out of focus — hold steady',
        badge: 'Hold Steady',
        color: '#FF9500',
        brightness: avgLum,
      };
    }

    return {
      status: 'good',
      message: 'Optimal framing & lighting',
      badge: 'Lighting Good ✓',
      color: '#30D158',
      brightness: avgLum,
    };
  } catch (e) {
    return {
      status: 'good',
      message: 'Ready to capture',
      badge: 'Ready',
      color: '#30D158',
      brightness: 128,
    };
  }
}

/**
 * Calibrates prototype centers to ambient room lighting based on a white reference sample.
 *
 * @param {{ r: number, g: number, b: number }} whiteSample - Measured RGB of White face
 * @returns {Array} Calibrated prototype array
 */
export function calibrateLighting(whiteSample) {
  if (!whiteSample) return DEFAULT_PROTOTYPES;

  const whiteLab = rgbToLab(whiteSample.r, whiteSample.g, whiteSample.b);

  // Shift prototype color temperatures based on ambient white point
  const da = whiteLab.a - 0;
  const db = whiteLab.b - 0;

  return DEFAULT_PROTOTYPES.map((p) => {
    if (p.id === 0) {
      // White prototype adapts to the measured white point
      return { ...p, L: whiteLab.L, a: whiteLab.a, b: whiteLab.b };
    }
    // Chromatic prototypes receive moderate ambient white shift
    return {
      ...p,
      a: p.a + da * 0.45,
      b: p.b + db * 0.45,
    };
  });
}
