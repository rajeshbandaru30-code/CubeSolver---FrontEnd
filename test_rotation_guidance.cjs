/**
 * test_rotation_guidance.cjs
 *
 * Automated test suite for the 3D whole-cube rotation guidance engine:
 * 1. Test 6-face sequence transitions (0 -> 2 -> 1 -> 5 -> 4 -> 3).
 * 2. Test Euler angles and whole-cube rotation vectors.
 * 3. Test dynamic center color identity resolution.
 * 4. Test 90° CW and CCW grid rotations on 3x3 sticker arrays.
 * 5. Test arbitrary face jump navigation & retake preserves.
 * 6. Test full 6-face guided scan simulation with 54-facelet reconstruction.
 * 7. Test mathematical parity verification and submission to Spring Boot Kociemba solver.
 */

const assert = require('assert');
const http = require('http');

async function runTests() {
  console.log('========================================================================');
  console.log('3D ROTATION GUIDANCE & ORIENTATION ENGINE TEST SUITE');
  console.log('========================================================================\n');

  const {
    RECOMMENDED_SCAN_SEQUENCE,
    FACE_EULER_ANGLES,
    getFaceCenterInfo,
    getFaceOrientation,
    calculateNextFace,
    getRotationGuidance,
    rotateGrid90,
  } = await import('./src/engine/orientationGuide.js');

  const { validateCubeState } = await import('./src/engine/cubeValidatorClient.js');

  // ── [1/7] Test Recommended Sequence Coverage ──
  console.log('[1/7] Testing Recommended Scanning Sequence...');
  assert.strictEqual(RECOMMENDED_SCAN_SEQUENCE.length, 6, 'Should cover all 6 faces');
  assert.deepStrictEqual(
    RECOMMENDED_SCAN_SEQUENCE,
    [0, 2, 1, 5, 4, 3],
    'Sequence must be U(White) -> F(Green) -> R(Red) -> B(Blue) -> L(Orange) -> D(Yellow)'
  );
  console.log('  ✓ Recommended ergonomic sequence verified: White -> Green -> Red -> Blue -> Orange -> Yellow\n');

  // ── [2/7] Test Whole-Cube Euler Rotations & Directions ──
  console.log('[2/7] Testing 3D Whole-Cube Rotations for Consecutive Steps...');

  // Step 1: White (0) -> Green (2)
  const g1 = getRotationGuidance(0, 2, {});
  assert.strictEqual(g1.direction, 'TILT_DOWN', '0 -> 2 should tilt forward/down');
  assert.strictEqual(g1.rotationAxis, 'x', '0 -> 2 tilts along horizontal X axis');
  assert.strictEqual(g1.toFace.name, 'Green', 'Target is Green');
  assert.strictEqual(g1.topFace.name, 'White', 'Keep White on top');
  console.log('  ✓ White -> Green: Tilt 90° down, keep White on top');

  // Step 2: Green (2) -> Red (1)
  const g2 = getRotationGuidance(2, 1, {});
  assert.strictEqual(g2.direction, 'ROTATE_LEFT', '2 -> 1 should rotate left');
  assert.strictEqual(g2.rotationAxis, 'y', '2 -> 1 rotates along vertical Y axis');
  assert.strictEqual(g2.toFace.name, 'Red', 'Target is Red');
  assert.strictEqual(g2.topFace.name, 'White', 'Keep White on top');
  console.log('  ✓ Green -> Red: Rotate 90° left, keep White on top');

  // Step 3: Red (1) -> Blue (5)
  const g3 = getRotationGuidance(1, 5, {});
  assert.strictEqual(g3.direction, 'ROTATE_LEFT', '1 -> 5 should rotate left');
  assert.strictEqual(g3.toFace.name, 'Blue', 'Target is Blue');
  assert.strictEqual(g3.topFace.name, 'White', 'Keep White on top');
  console.log('  ✓ Red -> Blue: Rotate 90° left, keep White on top');

  // Step 4: Blue (5) -> Orange (4)
  const g4 = getRotationGuidance(5, 4, {});
  assert.strictEqual(g4.direction, 'ROTATE_LEFT', '5 -> 4 should rotate left');
  assert.strictEqual(g4.toFace.name, 'Orange', 'Target is Orange');
  assert.strictEqual(g4.topFace.name, 'White', 'Keep White on top');
  console.log('  ✓ Blue -> Orange: Rotate 90° left, keep White on top');

  // Step 5: Orange (4) -> Yellow (3)
  const g5 = getRotationGuidance(4, 3, {});
  assert.strictEqual(g5.direction, 'TILT_UP', '4 -> 3 should tilt upward');
  assert.strictEqual(g5.toFace.name, 'Yellow', 'Target is Yellow');
  console.log('  ✓ Orange -> Yellow: Tilt 90° upward to Yellow bottom\n');

  // ── [3/7] Test Dynamic Center Color Resolution ──
  console.log('[3/7] Testing Dynamic Center Color Detection...');
  // Mock custom center on Front face (e.g. customized cube or observed sticker)
  const mockScanned = {
    0: [{ index: 4, colorId: 0, colorName: 'White', hex: '#FFFFFF' }],
    2: [{ index: 4, colorId: 2, colorName: 'Emerald Green', hex: '#22C55E' }],
  };
  // Ensure array has 9 elements for face 2
  mockScanned[2] = new Array(9).fill(null).map((_, i) => ({
    index: i,
    colorId: 2,
    colorName: i === 4 ? 'Emerald Green' : 'Green',
    hex: '#22C55E',
  }));

  const observedCenter = getFaceCenterInfo(2, mockScanned);
  assert.strictEqual(observedCenter.name, 'Emerald Green', 'Should resolve dynamic center name');
  console.log('  ✓ Dynamic observed center correctly resolved\n');

  // ── [4/7] Test 90° CW and CCW Grid Rotations ──
  console.log('[4/7] Testing 90° Grid Reorientation (CW and CCW)...');
  // Create sample 3x3 grid:
  // 0 1 2
  // 3 4 5
  // 6 7 8
  const initialGrid = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((val) => ({
    index: val,
    colorId: val % 6,
    colorName: `C${val}`,
    hex: '#FFFFFF',
  }));

  // 90° CW rotation:
  // 6 3 0
  // 7 4 1
  // 8 5 2
  const cwRotated = rotateGrid90(initialGrid, 'CW');
  assert.strictEqual(cwRotated[0].colorName, 'C6', 'Top-left is now C6');
  assert.strictEqual(cwRotated[1].colorName, 'C3', 'Top-center is now C3');
  assert.strictEqual(cwRotated[2].colorName, 'C0', 'Top-right is now C0');
  assert.strictEqual(cwRotated[4].colorName, 'C4', 'Center remains C4');
  assert.strictEqual(cwRotated[8].colorName, 'C2', 'Bottom-right is now C2');
  console.log('  ✓ 90° Clockwise grid rotation matches physical cube transformation');

  // 90° CCW rotation on cwRotated should restore original grid
  const ccwRestored = rotateGrid90(cwRotated, 'CCW');
  for (let i = 0; i < 9; i++) {
    assert.strictEqual(ccwRestored[i].colorName, initialGrid[i].colorName, `Restored cell ${i}`);
  }
  console.log('  ✓ 90° CCW inverse transformation exactly restores original grid\n');

  // ── [5/7] Test calculateNextFace Sequencing and Retakes ──
  console.log('[5/7] Testing calculateNextFace Sequence & Jump Navigation...');
  const state = {};
  assert.strictEqual(calculateNextFace(0, state), 2, 'After 0 (White), next is 2 (Green)');

  state[0] = true;
  assert.strictEqual(calculateNextFace(0, state), 2, 'With 0 scanned, next is 2');

  state[2] = true;
  assert.strictEqual(calculateNextFace(2, state), 1, 'After 2 (Green), next is 1 (Red)');

  state[1] = true;
  assert.strictEqual(calculateNextFace(1, state), 5, 'After 1 (Red), next is 5 (Blue)');

  state[5] = true;
  assert.strictEqual(calculateNextFace(5, state), 4, 'After 5 (Blue), next is 4 (Orange)');

  state[4] = true;
  assert.strictEqual(calculateNextFace(4, state), 3, 'After 4 (Orange), next is 3 (Yellow)');

  state[3] = true;
  assert.strictEqual(calculateNextFace(3, state), null, 'All 6 scanned -> returns null');
  console.log('  ✓ Sequence progression & state tracking verified\n');

  // ── [6/7] Test 54-Sticker Reconstruction from Guided Sequence ──
  console.log('[6/7] Simulating Full 6-Face Guided Scan Reconstruction...');
  // Standard solved cube facelet array
  const fullScannedFaces = {};
  for (let face = 0; face < 6; face++) {
    fullScannedFaces[face] = [];
    for (let pos = 0; pos < 9; pos++) {
      fullScannedFaces[face].push({
        index: pos,
        colorId: face,
        colorName: ['White', 'Red', 'Green', 'Yellow', 'Orange', 'Blue'][face],
        hex: ['#FFFFFF', '#EF4444', '#22C55E', '#FACC15', '#F97316', '#3B82F6'][face],
        confidence: 98,
        needsReview: false,
      });
    }
  }

  const reconstructed = new Array(54).fill(0);
  for (let face = 0; face < 6; face++) {
    for (let pos = 0; pos < 9; pos++) {
      reconstructed[face * 9 + pos] = fullScannedFaces[face][pos].colorId;
    }
  }

  assert.strictEqual(reconstructed.length, 54, 'Should have exactly 54 facelets');
  const parityResult = validateCubeState(reconstructed);
  assert.strictEqual(parityResult.valid, true, 'Reconstructed solved cube must pass parity laws');
  console.log('  ✓ Reconstructed 54-facelet state passed all 5 physical parity laws\n');

  // ── [7/7] Test Solving Reconstructed State via Spring Boot API ──
  console.log('[7/7] Submitting Valid Scanned State to Spring Boot Kociemba Solver...');

  // Simple 1-move scramble (R move applied to solved cube)
  // Canonical facelet indices after R move:
  const scrambledState = [...reconstructed];
  // Rotate R face 90° CW:
  const rOffset = 1 * 9;
  const oldR = scrambledState.slice(rOffset, rOffset + 9);
  const cwMap = [6, 3, 0, 7, 4, 1, 8, 5, 2];
  for (let i = 0; i < 9; i++) {
    scrambledState[rOffset + i] = oldR[cwMap[i]];
  }
  // Permute adjacent edges/corners:
  // U face col 2: indices 2, 5, 8
  // F face col 2: indices 20, 23, 26
  // D face col 2: indices 29, 32, 35
  // B face col 0: indices 45, 48, 51
  const u2 = scrambledState[2], u5 = scrambledState[5], u8 = scrambledState[8];
  const f2 = scrambledState[20], f5 = scrambledState[23], f8 = scrambledState[26];
  const d2 = scrambledState[29], d5 = scrambledState[32], d8 = scrambledState[35];
  const b0 = scrambledState[45], b3 = scrambledState[48], b6 = scrambledState[51];

  // Under R move: U -> B, B -> D, D -> F, F -> U
  scrambledState[20] = d2; scrambledState[23] = d5; scrambledState[26] = d8; // D -> F
  scrambledState[2] = f2;  scrambledState[5] = f5;   scrambledState[8] = f8;   // F -> U
  scrambledState[51] = u2; scrambledState[48] = u5;  scrambledState[45] = u8;  // U -> B (inverted)
  scrambledState[29] = b6; scrambledState[32] = b3;  scrambledState[35] = b0;  // B -> D (inverted)

  const scrambledParity = validateCubeState(scrambledState);
  assert.strictEqual(scrambledParity.valid, true, 'Scrambled state must pass parity laws');

  const postData = JSON.stringify({ facelets: scrambledState });

  await new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 8080,
        path: '/api/cube/solve',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            assert.strictEqual(res.statusCode, 200, 'Solver API must return 200 OK');
            const data = JSON.parse(body);
            assert.strictEqual(data.success, true, 'Solver returned success');
            assert.ok(data.solutionMoves, 'Solution moves must exist');
            console.log(`  ✓ Spring Boot Kociemba solver verified: "${data.solutionMoves}" (${data.moveCount} moves in ${data.solveTimeMs}ms)`);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });

  console.log('\n========================================================================');
  console.log('ALL 3D ROTATION GUIDANCE & ORIENTATION TESTS PASSED (100% SUCCESS)');
  console.log('========================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
