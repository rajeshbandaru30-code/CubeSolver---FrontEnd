/**
 * cubeMoves.test.js
 *
 * Unit tests for the JavaScript cube move engine (cubeMoves.js).
 *
 * VALIDATION STRATEGY:
 *   A move followed by its inverse must return to the starting state.
 *   A move applied 4 times must return to the starting state.
 *   A double move applied twice must return to the starting state.
 *   The solved state must be detected correctly.
 *
 * These tests run in the browser console via the test runner below.
 * They do NOT require a backend connection.
 *
 * To run: import runTests from './cubeMoves.test.js' and call runTests().
 */

import { applyMove, applyMoves, isSolved } from './cubeMoves';

function solvedState() {
  const f = new Array(54);
  for (let face = 0; face < 6; face++)
    for (let pos = 0; pos < 9; pos++)
      f[face * 9 + pos] = face;
  return f;
}

function arrEq(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function assert(condition, msg) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
}

const ALL_MOVES = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'R', "R'", 'R2',
  'L', "L'", 'L2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
];

const FACES = ['U', 'D', 'R', 'L', 'F', 'B'];

export default function runTests() {
  const results = [];
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      results.push({ name, ok: true });
      passed++;
    } catch (e) {
      results.push({ name, ok: false, error: e.message });
      failed++;
    }
  }

  const solved = solvedState();

  // ── isSolved ──
  test('isSolved: solved state is recognised', () => {
    assert(isSolved(solved), 'solved state should be solved');
  });
  test('isSolved: scrambled state is not solved', () => {
    const f = applyMove(solved, 'R');
    assert(!isSolved(f), 'after R, cube should not be solved');
  });

  // ── Order 4: every CW move × 4 = identity ──
  for (const face of FACES) {
    test(`${face} × 4 = identity`, () => {
      const f4 = applyMoves(solved, [face, face, face, face]);
      assert(arrEq(f4, solved), `${face}×4 should restore solved state`);
    });
  }

  // ── Order 2: every double move × 2 = identity ──
  for (const face of FACES) {
    test(`${face}2 × 2 = identity`, () => {
      const f2 = applyMoves(solved, [`${face}2`, `${face}2`]);
      assert(arrEq(f2, solved), `${face}2×2 should restore solved state`);
    });
  }

  // ── Inverse: move + inverse = identity ──
  for (const face of FACES) {
    test(`${face} + ${face}' = identity`, () => {
      const inv = applyMoves(solved, [face, `${face}'`]);
      assert(arrEq(inv, solved), `${face}+${face}' should restore solved state`);
    });
    test(`${face}' + ${face} = identity`, () => {
      const inv = applyMoves(solved, [`${face}'`, face]);
      assert(arrEq(inv, solved), `${face}'+${face} should restore solved state`);
    });
    test(`${face}2 = ${face} + ${face}`, () => {
      const d = applyMove(solved, `${face}2`);
      const cc = applyMoves(solved, [face, face]);
      assert(arrEq(d, cc), `${face}2 should equal ${face}+${face}`);
    });
    test(`${face}' = ${face} + ${face} + ${face}`, () => {
      const inv = applyMove(solved, `${face}'`);
      const ccc = applyMoves(solved, [face, face, face]);
      assert(arrEq(inv, ccc), `${face}' should equal ${face}×3`);
    });
  }

  // ── Known move test: U moves F top row → R top row ──
  test('U move: F row-0 stickers move to R face', () => {
    const f = applyMove(solved, 'U');
    // After U CW on solved cube: F top row (pos 0,1,2) get R's color (colorCode 1)
    // because F top → gets what was R top. On solved cube, R top = [R,R,R].
    // Java: F top gets R top values = colorCode 1 (R face color)
    assert(f[2*9+0] === 1, 'F[0] should be R color after U');
    assert(f[2*9+1] === 1, 'F[1] should be R color after U');
    assert(f[2*9+2] === 1, 'F[2] should be R color after U');
  });

  // ── Known move test: R moves F right col → U right col ──
  test('R move: F right col stickers move to U right col', () => {
    const f = applyMove(solved, 'R');
    // After R CW on solved: U right col (pos 2,5,8) get F face color (2 = Green)
    assert(f[0*9+2] === 2, 'U[2] should be F color after R');
    assert(f[0*9+5] === 2, 'U[5] should be F color after R');
    assert(f[0*9+8] === 2, 'U[8] should be F color after R');
  });

  // ── Known move test: F moves U bottom row → R left col ──
  test('F move: U bottom row stickers move to R left col', () => {
    const f = applyMove(solved, 'F');
    // After F CW on solved: R left col (pos 0,3,6) get U face color (0 = White)
    assert(f[1*9+0] === 0, 'R[0] should be U color after F');
    assert(f[1*9+3] === 0, 'R[3] should be U color after F');
    assert(f[1*9+6] === 0, 'R[6] should be U color after F');
  });

  // ── Scramble + undo ──
  test('Scramble + inverse restores solved state', () => {
    const scramble = ['R', 'U', "B'", 'L2', 'F', "D'", 'U2', 'R'];
    const inverse  = ["R'", "U2", 'D', "F'", 'L2', 'B', "U'", "R'"];
    const scrambled = applyMoves(solved, scramble);
    assert(!isSolved(scrambled), 'Should not be solved after scramble');
    const restored = applyMoves(scrambled, inverse);
    assert(arrEq(restored, solved), 'Should be solved after inverse sequence');
  });

  // ── Superflip: U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2 ──
  // This is a well-known sequence. We just check it doesn't crash.
  test('Superflip sequence does not throw', () => {
    const sf = ["U","R2","F","B","R","B2","R","U2","L","B2","R","U'","D'","R2","F","R'","L","B2","U2","F2"];
    const f = applyMoves(solved, sf);
    assert(f.length === 54, 'Should produce 54 facelets');
    assert(!isSolved(f), 'Superflip should not be solved');
  });

  console.group('cubeMoves.js test results');
  results.forEach(r => {
    if (r.ok) console.log(`  ✅ ${r.name}`);
    else      console.error(`  ❌ ${r.name}: ${r.error}`);
  });
  console.groupEnd();
  console.log(`Results: ${passed} passed, ${failed} failed`);

  return { passed, failed, results };
}
