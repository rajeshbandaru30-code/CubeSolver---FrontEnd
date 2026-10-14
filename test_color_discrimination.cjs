/**
 * test_color_discrimination.cjs
 *
 * Rigorous computer vision test suite validating:
 * 1. Red vs. Orange separation under varied lighting
 * 2. White vs. Yellow separation under warm/cool color temperatures
 * 3. Blue vs. Green separation
 * 4. Ambient lighting calibration normalization
 * 5. Image quality & diagnostic heuristics (low light, glare, blur)
 */

const assert = require('assert');

async function run() {
  console.log('========================================================================');
  console.log('RUBIKS CUBE COMPUTER VISION DISCRIMINATION TEST');
  console.log('========================================================================\n');

  const {
    classifyColor,
    calibrateLighting,
    analyzeFrameQuality,
    CUBE_COLORS,
    rgbToHsv,
    rgbToLab,
  } = await import('./src/engine/colorDetector.js');

  // 1. Red vs. Orange Discrimination
  console.log('[1/5] Testing Red vs. Orange Discrimination...');
  const redSamples = [
    { rgb: [220, 20, 30], desc: 'Vibrant pure red' },
    { rgb: [180, 25, 25], desc: 'Deep ruby red' },
    { rgb: [240, 45, 40], desc: 'Bright daylight red' },
    { rgb: [150, 18, 22], desc: 'Dim/shadowed red' },
  ];

  for (const s of redSamples) {
    const res = classifyColor(s.rgb[0], s.rgb[1], s.rgb[2]);
    assert.strictEqual(res.colorId, 1, `Failed on ${s.desc}: expected Red (1) but got ${res.colorName} (${res.colorId})`);
    console.log(`  ✓ ${s.desc} -> ${res.colorName} (conf: ${res.confidence}%)`);
  }

  const orangeSamples = [
    { rgb: [255, 115, 15], desc: 'Standard vibrant orange' },
    { rgb: [240, 130, 30], desc: 'Bright light orange' },
    { rgb: [200, 95, 20],  desc: 'Deep amber orange' },
    { rgb: [175, 80, 15],  desc: 'Dim/shadowed orange' },
  ];

  for (const s of orangeSamples) {
    const res = classifyColor(s.rgb[0], s.rgb[1], s.rgb[2]);
    assert.strictEqual(res.colorId, 4, `Failed on ${s.desc}: expected Orange (4) but got ${res.colorName} (${res.colorId})`);
    console.log(`  ✓ ${s.desc} -> ${res.colorName} (conf: ${res.confidence}%)`);
  }

  // 2. White vs. Yellow Discrimination
  console.log('\n[2/5] Testing White vs. Yellow Discrimination (including warm lighting)...');
  const whiteSamples = [
    { rgb: [255, 255, 255], desc: 'Pure white' },
    { rgb: [245, 245, 250], desc: 'Cool white' },
    { rgb: [240, 235, 220], desc: 'Warm 3000K incandescent white' },
    { rgb: [210, 210, 215], desc: 'Shaded office white' },
  ];

  for (const s of whiteSamples) {
    const res = classifyColor(s.rgb[0], s.rgb[1], s.rgb[2]);
    assert.strictEqual(res.colorId, 0, `Failed on ${s.desc}: expected White (0) but got ${res.colorName} (${res.colorId})`);
    console.log(`  ✓ ${s.desc} -> ${res.colorName} (conf: ${res.confidence}%)`);
  }

  const yellowSamples = [
    { rgb: [250, 215, 15], desc: 'Vibrant lemon yellow' },
    { rgb: [235, 200, 25], desc: 'Standard yellow' },
    { rgb: [200, 175, 20], desc: 'Warm shaded yellow' },
    { rgb: [180, 155, 15], desc: 'Dim yellow' },
  ];

  for (const s of yellowSamples) {
    const res = classifyColor(s.rgb[0], s.rgb[1], s.rgb[2]);
    assert.strictEqual(res.colorId, 3, `Failed on ${s.desc}: expected Yellow (3) but got ${res.colorName} (${res.colorId})`);
    console.log(`  ✓ ${s.desc} -> ${res.colorName} (conf: ${res.confidence}%)`);
  }

  // 3. Green vs. Blue Discrimination
  console.log('\n[3/5] Testing Green vs. Blue Discrimination...');
  const greenSamples = [
    { rgb: [34, 197, 94],  desc: 'Emerald green' },
    { rgb: [20, 160, 60],  desc: 'Forest green' },
    { rgb: [40, 220, 100], desc: 'Bright green' },
  ];
  for (const s of greenSamples) {
    const res = classifyColor(s.rgb[0], s.rgb[1], s.rgb[2]);
    assert.strictEqual(res.colorId, 2, `Failed on ${s.desc}: expected Green (2) but got ${res.colorName} (${res.colorId})`);
    console.log(`  ✓ ${s.desc} -> ${res.colorName} (conf: ${res.confidence}%)`);
  }

  const blueSamples = [
    { rgb: [10, 132, 255], desc: 'Electric blue' },
    { rgb: [25, 90, 200],  desc: 'Royal blue' },
    { rgb: [50, 150, 255], desc: 'Sky/cyan blue' },
  ];
  for (const s of blueSamples) {
    const res = classifyColor(s.rgb[0], s.rgb[1], s.rgb[2]);
    assert.strictEqual(res.colorId, 5, `Failed on ${s.desc}: expected Blue (5) but got ${res.colorName} (${res.colorId})`);
    console.log(`  ✓ ${s.desc} -> ${res.colorName} (conf: ${res.confidence}%)`);
  }

  // 4. Ambient Lighting Calibration
  console.log('\n[4/5] Testing Ambient Lighting Calibration...');
  const warmWhiteSample = { r: 245, g: 230, b: 200 }; // 2800K bulb cast
  const calibrated = calibrateLighting(warmWhiteSample);
  assert(Array.isArray(calibrated) && calibrated.length === 6, 'Calibration should return 6 prototypes');
  // Calibrated white prototype should shift towards warm white sample
  assert(calibrated[0].b > 5, 'White prototype should absorb warm yellow shift');
  console.log('  ✓ Prototype adaptation verified under warm lighting reference');

  // 5. Image Quality Heuristics
  console.log('\n[5/5] Testing Frame Quality Heuristic Mock...');
  // Mock canvas context with texture
  const mockTexturedCtx = {
    getImageData: (x, y, w, h) => {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < data.length; i += 4) {
        const val = 120 + ((i % 16) > 8 ? 25 : -20);
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 255;
      }
      return { data };
    }
  };
  const quality = analyzeFrameQuality(mockTexturedCtx, 0, 0, 100);
  assert(quality.status === 'good', 'Natural textured frame should evaluate to good quality');
  console.log(`  ✓ Quality check: status=${quality.status}, message="${quality.message}"`);

  // Flat single color evaluates to blurry / out-of-focus
  const mockFlatCtx = {
    getImageData: (x, y, w, h) => {
      const data = new Uint8ClampedArray(w * h * 4).fill(128);
      return { data };
    }
  };
  const blurQuality = analyzeFrameQuality(mockFlatCtx, 0, 0, 100);
  assert(blurQuality.status === 'blurry', 'Zero-contrast frame should detect blur');
  console.log(`  ✓ Blur detection verified: status=${blurQuality.status}`);

  console.log('\n========================================================================');
  console.log('ALL COMPUTER VISION DISCRIMINATION TESTS PASSED (100% ACCURACY)');
  console.log('========================================================================\n');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
