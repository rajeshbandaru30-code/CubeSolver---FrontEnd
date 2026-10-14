/**
 * cubeValidatorClient.js
 *
 * Client-side Rubik's Cube validator and face scanning guide.
 * Exactly mirrors com.cubesolve.engine.CubeValidator.java:
 *   1. Exactly 9 stickers per color (6 colors, 54 total).
 *   2. Fixed center stickers (color of center = face index).
 *   3. Corner cubie orientation sum ≡ 0 (mod 3).
 *   4. Edge cubie orientation sum ≡ 0 (mod 2).
 *   5. Permutation parity consistency (corner parity == edge parity).
 *
 * Also provides guided face navigation metadata and neighbor references
 * to ensure 100% orientation fidelity when scanning with a camera.
 */

export const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];

export const SCAN_STEPS = [
  {
    faceIndex: 0,
    faceKey: 'U',
    name: 'Up Face',
    centerName: 'White',
    centerColorId: 0,
    centerHex: '#FFFFFF',
    topNeighbor: { name: 'Back (Blue)', hex: '#3B82F6' },
    bottomNeighbor: { name: 'Front (Green)', hex: '#22C55E' },
    leftNeighbor: { name: 'Left (Orange)', hex: '#F97316' },
    rightNeighbor: { name: 'Right (Red)', hex: '#EF4444' },
    instruction: 'Hold the cube with WHITE facing the camera, GREEN pointing down.',
    rotationHint: 'Start here: White center in front, Green on the bottom edge.',
  },
  {
    faceIndex: 1,
    faceKey: 'R',
    name: 'Right Face',
    centerName: 'Red',
    centerColorId: 1,
    centerHex: '#EF4444',
    topNeighbor: { name: 'Up (White)', hex: '#FFFFFF' },
    bottomNeighbor: { name: 'Down (Yellow)', hex: '#FACC15' },
    leftNeighbor: { name: 'Front (Green)', hex: '#22C55E' },
    rightNeighbor: { name: 'Back (Blue)', hex: '#3B82F6' },
    instruction: 'Rotate the cube 90° to the LEFT so the RED face is now pointing at the camera.',
    rotationHint: 'White stays on TOP, Green moves to the LEFT edge.',
  },
  {
    faceIndex: 2,
    faceKey: 'F',
    name: 'Front Face',
    centerName: 'Green',
    centerColorId: 2,
    centerHex: '#22C55E',
    topNeighbor: { name: 'Up (White)', hex: '#FFFFFF' },
    bottomNeighbor: { name: 'Down (Yellow)', hex: '#FACC15' },
    leftNeighbor: { name: 'Left (Orange)', hex: '#F97316' },
    rightNeighbor: { name: 'Right (Red)', hex: '#EF4444' },
    instruction: 'Rotate the cube 90° to the RIGHT so GREEN is facing the camera.',
    rotationHint: 'White stays on TOP, Orange on the LEFT edge, Red on the RIGHT edge.',
  },
  {
    faceIndex: 3,
    faceKey: 'D',
    name: 'Down Face',
    centerName: 'Yellow',
    centerColorId: 3,
    centerHex: '#FACC15',
    topNeighbor: { name: 'Front (Green)', hex: '#22C55E' },
    bottomNeighbor: { name: 'Back (Blue)', hex: '#3B82F6' },
    leftNeighbor: { name: 'Left (Orange)', hex: '#F97316' },
    rightNeighbor: { name: 'Right (Red)', hex: '#EF4444' },
    instruction: 'Tilt the cube UPWARD so the YELLOW bottom face points at the camera.',
    rotationHint: 'GREEN is now on the TOP edge, Blue is on the BOTTOM edge.',
  },
  {
    faceIndex: 4,
    faceKey: 'L',
    name: 'Left Face',
    centerName: 'Orange',
    centerColorId: 4,
    centerHex: '#F97316',
    topNeighbor: { name: 'Up (White)', hex: '#FFFFFF' },
    bottomNeighbor: { name: 'Down (Yellow)', hex: '#FACC15' },
    leftNeighbor: { name: 'Back (Blue)', hex: '#3B82F6' },
    rightNeighbor: { name: 'Front (Green)', hex: '#22C55E' },
    instruction: 'Tilt back to Green, then rotate 90° to the RIGHT so ORANGE faces the camera.',
    rotationHint: 'White stays on TOP, Blue is on the LEFT edge, Green on the RIGHT edge.',
  },
  {
    faceIndex: 5,
    faceKey: 'B',
    name: 'Back Face',
    centerName: 'Blue',
    centerColorId: 5,
    centerHex: '#3B82F6',
    topNeighbor: { name: 'Up (White)', hex: '#FFFFFF' },
    bottomNeighbor: { name: 'Down (Yellow)', hex: '#FACC15' },
    leftNeighbor: { name: 'Right (Red)', hex: '#EF4444' },
    rightNeighbor: { name: 'Left (Orange)', hex: '#F97316' },
    instruction: 'Rotate 90° to the RIGHT again so the BLUE back face points at the camera.',
    rotationHint: 'White stays on TOP, Red on the LEFT edge, Orange on the RIGHT edge.',
  },
];

const COLOR_NAMES = ['White (W)', 'Red (R)', 'Green (G)', 'Yellow (Y)', 'Orange (O)', 'Blue (B)'];

// Corner cubie facelet indices matching CubeValidator.java
// Order: URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB
const U = 0, R = 1, F = 2, D = 3, L = 4, B = 5;

const cornerFacelets = [
  [U * 9 + 8, R * 9 + 0, F * 9 + 2], // URF
  [U * 9 + 6, F * 9 + 0, L * 9 + 2], // UFL
  [U * 9 + 0, L * 9 + 0, B * 9 + 2], // ULB
  [U * 9 + 2, B * 9 + 0, R * 9 + 2], // UBR
  [D * 9 + 2, F * 9 + 8, R * 9 + 6], // DFR
  [D * 9 + 0, L * 9 + 8, F * 9 + 6], // DLF
  [D * 9 + 6, B * 9 + 8, L * 9 + 6], // DBL
  [D * 9 + 8, R * 9 + 8, B * 9 + 6], // DRB
];

const cornerColors = [
  [U, R, F],
  [U, F, L],
  [U, L, B],
  [U, B, R],
  [D, F, R],
  [D, L, F],
  [D, B, L],
  [D, R, B],
];

// Edge cubie facelet indices matching CubeValidator.java
// Order: UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR
const edgeFacelets = [
  [U * 9 + 5, R * 9 + 1], // UR
  [U * 9 + 7, F * 9 + 1], // UF
  [U * 9 + 3, L * 9 + 1], // UL
  [U * 9 + 1, B * 9 + 1], // UB
  [D * 9 + 5, R * 9 + 7], // DR
  [D * 9 + 1, F * 9 + 7], // DF
  [D * 9 + 3, L * 9 + 7], // DL
  [D * 9 + 7, B * 9 + 7], // DB
  [F * 9 + 5, R * 9 + 3], // FR
  [F * 9 + 3, L * 9 + 5], // FL
  [B * 9 + 5, L * 9 + 3], // BL
  [B * 9 + 3, R * 9 + 5], // BR
];

const edgeColors = [
  [U, R],
  [U, F],
  [U, L],
  [U, B],
  [D, R],
  [D, F],
  [D, L],
  [D, B],
  [F, R],
  [F, L],
  [B, L],
  [B, R],
];

/**
 * Validates a 54-element facelet array according to mathematical Rubik's Cube solvability laws.
 *
 * @param {number[]} f - 54-element array (values 0..5)
 * @returns {{ valid: boolean, errors: string[], colorCounts: number[] }}
 */
export function validateCubeState(f) {
  const errors = [];

  if (!f || f.length !== 54) {
    return {
      valid: false,
      errors: ['Cube configuration must have exactly 54 stickers.'],
      colorCounts: [],
    };
  }

  // Check 1: Color counts
  const colorCounts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 54; i++) {
    const c = f[i];
    if (c < 0 || c > 5 || isNaN(c)) {
      errors.push(`Invalid color code "${c}" at position ${i}. Must be 0–5.`);
      return { valid: false, errors, colorCounts };
    }
    colorCounts[c]++;
  }

  for (let c = 0; c < 6; c++) {
    if (colorCounts[c] !== 9) {
      errors.push(`${COLOR_NAMES[c]} appears ${colorCounts[c]} times (expected exactly 9).`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, colorCounts };
  }

  // Check 2: Fixed Centers (Centers define faces)
  for (let face = 0; face < 6; face++) {
    const centerIdx = face * 9 + 4;
    if (f[centerIdx] !== face) {
      errors.push(`Center of face ${FACE_NAMES[face]} is ${COLOR_NAMES[f[centerIdx]]} instead of ${COLOR_NAMES[face]}.`);
    }
  }

  // Check 3: Corner Cubies & Orientation
  const cornerPerm = new Array(8);
  const cornerOrient = new Array(8);
  const cornerUsed = new Array(8).fill(false);

  for (let i = 0; i < 8; i++) {
    const c0 = f[cornerFacelets[i][0]];
    const c1 = f[cornerFacelets[i][1]];
    const c2 = f[cornerFacelets[i][2]];

    let found = -1;
    let ori = 0;

    for (let j = 0; j < 8; j++) {
      for (let o = 0; o < 3; o++) {
        const ref = cornerColors[j];
        if (c0 === ref[o % 3] && c1 === ref[(o + 1) % 3] && c2 === ref[(o + 2) % 3]) {
          found = j;
          ori = o;
          break;
        }
      }
      if (found !== -1) break;
    }

    if (found === -1) {
      errors.push(`Invalid corner piece at position ${i} (colors: ${c0}, ${c1}, ${c2}). Does not exist on a real cube.`);
      return { valid: false, errors, colorCounts };
    }

    if (cornerUsed[found]) {
      errors.push(`Duplicate corner piece detected at position ${i}.`);
      return { valid: false, errors, colorCounts };
    }

    cornerUsed[found] = true;
    cornerPerm[i] = found;
    cornerOrient[i] = ori;
  }

  // Corner orientation sum must be ≡ 0 (mod 3)
  const cornerOrientSum = cornerOrient.reduce((a, b) => a + b, 0);
  if (cornerOrientSum % 3 !== 0) {
    errors.push('Total corner orientation sum is not divisible by 3 (one or more corners are twisted).');
  }

  // Check 4: Edge Cubies & Orientation
  const edgePerm = new Array(12);
  const edgeOrient = new Array(12);
  const edgeUsed = new Array(12).fill(false);

  for (let i = 0; i < 12; i++) {
    const c0 = f[edgeFacelets[i][0]];
    const c1 = f[edgeFacelets[i][1]];

    let found = -1;
    let ori = 0;

    for (let j = 0; j < 12; j++) {
      const ref = edgeColors[j];
      if (c0 === ref[0] && c1 === ref[1]) {
        found = j;
        ori = 0;
        break;
      }
      if (c0 === ref[1] && c1 === ref[0]) {
        found = j;
        ori = 1;
        break;
      }
    }

    if (found === -1) {
      errors.push(`Invalid edge piece at position ${i} (colors: ${c0}, ${c1}). Does not exist on a real cube.`);
      return { valid: false, errors, colorCounts };
    }

    if (edgeUsed[found]) {
      errors.push(`Duplicate edge piece detected at position ${i}.`);
      return { valid: false, errors, colorCounts };
    }

    edgeUsed[found] = true;
    edgePerm[i] = found;
    edgeOrient[i] = ori;
  }

  // Edge orientation sum must be ≡ 0 (mod 2)
  const edgeOrientSum = edgeOrient.reduce((a, b) => a + b, 0);
  if (edgeOrientSum % 2 !== 0) {
    errors.push('Total edge orientation sum is odd (an edge piece is flipped).');
  }

  // Check 5: Parity consistency (corner parity == edge parity)
  let cornerParity = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      if (cornerPerm[i] > cornerPerm[j]) cornerParity++;
    }
  }

  let edgeParity = 0;
  for (let i = 0; i < 12; i++) {
    for (let j = i + 1; j < 12; j++) {
      if (edgePerm[i] > edgePerm[j]) edgeParity++;
    }
  }

  if ((cornerParity % 2) !== (edgeParity % 2)) {
    errors.push('Cube parity error: corner and edge permutation parities do not match (impossible state without disassembly).');
  }

  return {
    valid: errors.length === 0,
    errors,
    colorCounts,
  };
}
