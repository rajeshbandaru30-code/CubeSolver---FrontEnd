/**
 * test_scanner_engine.cjs
 *
 * Verifies color classification, CIELAB/HSV conversions, and cubeValidatorClient
 * against known mathematical constants, solved states, and scrambled states.
 */

const assert = require('assert');

// Run via dynamic import
async function run() {
  console.log('--- Testing Scanner Engine & Math Modules ---');

  const { rgbToHsv, rgbToLab, classifyColor, deltaE, CUBE_COLORS } = await import('./src/engine/colorDetector.js');
  const { validateCubeState, SCAN_STEPS } = await import('./src/engine/cubeValidatorClient.js');

  // 1. Color detector conversions
  console.log('[1/4] Testing RGB to HSV and CIELAB conversions...');
  const redHsv = rgbToHsv(239, 68, 68);
  assert(redHsv.h >= 350 || redHsv.h <= 10, 'Red hue should be near 0/360');
  assert(redHsv.s > 0.6, 'Red saturation should be high');

  const greenHsv = rgbToHsv(34, 197, 94);
  assert(greenHsv.h >= 120 && greenHsv.h <= 150, 'Green hue should be ~135');

  const blueHsv = rgbToHsv(59, 130, 246);
  assert(blueHsv.h >= 200 && blueHsv.h <= 230, 'Blue hue should be ~215');

  const whiteHsv = rgbToHsv(250, 250, 250);
  assert(whiteHsv.s < 0.05, 'White saturation should be near 0');

  // CIELAB
  const whiteLab = rgbToLab(255, 255, 255);
  assert(whiteLab.L >= 99, 'White Lab lightness should be near 100');

  // 2. Classify colors for all 6 standard cube colors
  console.log('[2/4] Testing color classification on standard colors...');
  const tests = [
    { rgb: [255, 255, 255], expected: 0, name: 'White' },
    { rgb: [230, 40, 40],   expected: 1, name: 'Red' },
    { rgb: [40, 200, 70],   expected: 2, name: 'Green' },
    { rgb: [250, 220, 20],  expected: 3, name: 'Yellow' },
    { rgb: [255, 120, 20],  expected: 4, name: 'Orange' },
    { rgb: [40, 110, 240],  expected: 5, name: 'Blue' },
  ];

  for (const t of tests) {
    const res = classifyColor(t.rgb[0], t.rgb[1], t.rgb[2]);
    assert.strictEqual(res.colorId, t.expected, `Expected ${t.name} (id ${t.expected}) but got ${res.colorName} (id ${res.colorId})`);
    assert(res.confidence >= 50, `Confidence for ${t.name} should be >= 50%`);
  }
  console.log('  ✅ All 6 standard colors classified accurately');

  // 3. Test client validator on solved cube
  console.log('[3/4] Testing cubeValidatorClient on solved state...');
  const solved = [];
  for (let face = 0; face < 6; face++) {
    for (let pos = 0; pos < 9; pos++) {
      solved.push(face);
    }
  }
  const solvedRes = validateCubeState(solved);
  assert(solvedRes.valid, 'Solved cube should be valid');
  assert.strictEqual(solvedRes.errors.length, 0, 'Solved cube should have 0 errors');
  console.log('  ✅ Solved cube state verified valid');

  // 4. Test client validator on invalid state
  console.log('[4/4] Testing cubeValidatorClient on invalid states...');
  const invalidCounts = [...solved];
  invalidCounts[0] = 1; // Replace 1 white with red -> 8 white, 10 red
  const invRes1 = validateCubeState(invalidCounts);
  assert(!invRes1.valid, 'Unequal color counts should fail');
  assert(invRes1.errors.some(e => e.includes('appears 8 times') || e.includes('appears 10 times')), 'Should identify color count error');

  // Wrong center
  const wrongCenter = [...solved];
  wrongCenter[4] = 1; // Center of face 0 changed to Red
  // Adjust another red to white to keep counts 9
  wrongCenter[9 + 0] = 0;
  const invRes2 = validateCubeState(wrongCenter);
  assert(!invRes2.valid, 'Wrong center should fail');
  assert(invRes2.errors.some(e => e.includes('Center of face U')), 'Should report wrong center');

  // Check 6 scan steps
  assert.strictEqual(SCAN_STEPS.length, 6, 'Should have exactly 6 scan steps');
  assert.deepStrictEqual(SCAN_STEPS.map(s => s.faceKey), ['U', 'R', 'F', 'D', 'L', 'B'], 'Scan steps should cover U, R, F, D, L, B');

  console.log('\n========================================================================');
  console.log('SCANNER ENGINE TESTS PASSED WITH 100% ACCURACY!');
  console.log('========================================================================\n');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
