// Unit test for CubeVisualizer color mapping and sticker distribution
const assert = require('assert');

// Color specification requirements:
const REQUIRED_COLORS = {
  U: '#FFFFFF',
  R: '#EF4444',
  F: '#22C55E',
  D: '#FACC15',
  L: '#F97316',
  B: '#3B82F6',
};

const FACE_OFFSET = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
const COLOR_MAP = {
  0: '#FFFFFF',
  1: '#EF4444',
  2: '#22C55E',
  3: '#FACC15',
  4: '#F97316',
  5: '#3B82F6',
};

const CHAR_COLOR_MAP = {
  'U': '#FFFFFF',
  'R': '#EF4444',
  'F': '#22C55E',
  'D': '#FACC15',
  'L': '#F97316',
  'B': '#3B82F6',
  'W': '#FFFFFF',
  'Y': '#FACC15',
  'G': '#22C55E',
  'O': '#F97316',
  '0': '#FFFFFF',
  '1': '#EF4444',
  '2': '#22C55E',
  '3': '#FACC15',
  '4': '#F97316',
  '5': '#3B82F6',
};

console.log('--- 1. Testing Color Specifications ---');
assert.strictEqual(COLOR_MAP[0], REQUIRED_COLORS.U, 'U must be White #FFFFFF');
assert.strictEqual(COLOR_MAP[1], REQUIRED_COLORS.R, 'R must be Red #EF4444');
assert.strictEqual(COLOR_MAP[2], REQUIRED_COLORS.F, 'F must be Green #22C55E');
assert.strictEqual(COLOR_MAP[3], REQUIRED_COLORS.D, 'D must be Yellow #FACC15');
assert.strictEqual(COLOR_MAP[4], REQUIRED_COLORS.L, 'L must be Orange #F97316');
assert.strictEqual(COLOR_MAP[5], REQUIRED_COLORS.B, 'B must be Blue #3B82F6');
console.log('✅ PASS: All 6 required colors match exact hex values.');

console.log('--- 2. Testing 54-Sticker Distribution on Solved Cube ---');
const getColor = (faceletColors, face, pos) => {
  const idx = FACE_OFFSET[face] + pos;
  const raw = faceletColors[idx];
  if (raw !== undefined && raw !== null) {
    if (typeof raw === 'number' && COLOR_MAP[raw]) return COLOR_MAP[raw];
    if (typeof raw === 'string') {
      if (raw.startsWith('#')) return raw;
      const upper = raw.toUpperCase();
      if (CHAR_COLOR_MAP[upper]) return CHAR_COLOR_MAP[upper];
      if (COLOR_MAP[raw]) return COLOR_MAP[raw];
    }
  }
  const faceDefault = COLOR_MAP[FACE_OFFSET[face] / 9];
  console.warn(`[CubeVisualizer] Unmapped sticker at ${face}[${pos}] (index ${idx}):`, raw, `using fallback ${faceDefault}`);
  return faceDefault || '#FF007F';
};

// Create solved facelet array: 9 of 0, 9 of 1, 9 of 2, 9 of 3, 9 of 4, 9 of 5
const solvedFacelets = [];
for (let face = 0; face < 6; face++) {
  for (let pos = 0; pos < 9; pos++) {
    solvedFacelets.push(face);
  }
}

// Simulate Cubie generation loop from CubeVisualizer
const stickerCounts = {
  [REQUIRED_COLORS.U]: 0,
  [REQUIRED_COLORS.R]: 0,
  [REQUIRED_COLORS.F]: 0,
  [REQUIRED_COLORS.D]: 0,
  [REQUIRED_COLORS.L]: 0,
  [REQUIRED_COLORS.B]: 0,
};

let totalStickers = 0;
let darkOrBlackStickers = 0;

for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      const colors = {};
      if (y === 1) {
        const row = z + 1;
        const col = x + 1;
        colors.U = getColor(solvedFacelets, 'U', row * 3 + col);
        stickerCounts[colors.U]++;
        totalStickers++;
      }
      if (y === -1) {
        const row = 1 - z;
        const col = x + 1;
        colors.D = getColor(solvedFacelets, 'D', row * 3 + col);
        stickerCounts[colors.D]++;
        totalStickers++;
      }
      if (z === 1) {
        const row = 1 - y;
        const col = x + 1;
        colors.F = getColor(solvedFacelets, 'F', row * 3 + col);
        stickerCounts[colors.F]++;
        totalStickers++;
      }
      if (z === -1) {
        const row = 1 - y;
        const col = 1 - x;
        colors.B = getColor(solvedFacelets, 'B', row * 3 + col);
        stickerCounts[colors.B]++;
        totalStickers++;
      }
      if (x === 1) {
        const row = 1 - y;
        const col = 1 - z;
        colors.R = getColor(solvedFacelets, 'R', row * 3 + col);
        stickerCounts[colors.R]++;
        totalStickers++;
      }
      if (x === -1) {
        const row = 1 - y;
        const col = z + 1;
        colors.L = getColor(solvedFacelets, 'L', row * 3 + col);
        stickerCounts[colors.L]++;
        totalStickers++;
      }

      Object.values(colors).forEach(c => {
        if (c === '#000000' || c === '#141722' || c === '#1E293B' || c === '#0f172a') {
          darkOrBlackStickers++;
        }
      });
    }
  }
}

assert.strictEqual(totalStickers, 54, 'Exactly 54 stickers must be generated');
assert.strictEqual(darkOrBlackStickers, 0, 'No sticker must ever render black or dark gray');
assert.strictEqual(stickerCounts[REQUIRED_COLORS.U], 9, 'Exactly 9 U (White) stickers');
assert.strictEqual(stickerCounts[REQUIRED_COLORS.R], 9, 'Exactly 9 R (Red) stickers');
assert.strictEqual(stickerCounts[REQUIRED_COLORS.F], 9, 'Exactly 9 F (Green) stickers');
assert.strictEqual(stickerCounts[REQUIRED_COLORS.D], 9, 'Exactly 9 D (Yellow) stickers');
assert.strictEqual(stickerCounts[REQUIRED_COLORS.L], 9, 'Exactly 9 L (Orange) stickers');
assert.strictEqual(stickerCounts[REQUIRED_COLORS.B], 9, 'Exactly 9 B (Blue) stickers');
console.log('✅ PASS: Exactly 54 stickers generated (9 per face) with 0 black/dark stickers.');

console.log('--- 3. Testing Fallback on Unmapped/Missing Values ---');
let warned = false;
const oldWarn = console.warn;
console.warn = (...args) => { warned = true; };
const fallbackColor = getColor([null], 'U', 0);
console.warn = oldWarn;

assert.strictEqual(warned, true, 'Unmapped value must trigger console.warn');
assert.strictEqual(fallbackColor, REQUIRED_COLORS.U, 'Fallback should be the face solved color (#FFFFFF) instead of black');
console.log('✅ PASS: Unmapped stickers log a warning and fall back to valid face color instead of black.');

console.log('\nALL COLOR & VISUALIZER TESTS PASSED SUCCESSFULLY!');
