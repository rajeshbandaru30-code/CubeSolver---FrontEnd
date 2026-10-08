/**
 * cubeMoves.js
 *
 * JavaScript port of com.cubesolve.engine.CubeMoves.java
 *
 * IMPORTANT: This is an EXACT mirror of the Java implementation.
 * Every index, every cycle direction, every swap must match the Java source.
 * Any divergence will cause the visual state to desync from the backend.
 *
 * Backend face index convention (from CubeState.java):
 *   0 = U (Up / White)
 *   1 = R (Right / Red)
 *   2 = F (Front / Green)
 *   3 = D (Down / Yellow)
 *   4 = L (Left / Orange)
 *   5 = B (Back / Blue)
 *
 * facelets[face * 9 + position] = colorCode (0-5)
 * Positions 0-8 in reading order:
 *   0 1 2
 *   3 4 5
 *   6 7 8
 */

// Face indices — match CubeState.java constants
const U = 0, R = 1, F = 2, D = 3, L = 4, B = 5;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Deep-copies a 54-element facelet array */
function clone(f) {
  return f.slice();
}

/**
 * Rotates the 9 stickers of a face 90° clockwise IN-PLACE.
 * Mirrors CubeMoves.rotateFaceCW():
 *   0→2, 1→5, 2→8, 3→1, 4→4, 5→7, 6→0, 7→3, 8→6
 */
function rotateFaceCW(f, face) {
  const b = face * 9;
  // Corners
  let tmp = f[b + 0];
  f[b + 0] = f[b + 6];
  f[b + 6] = f[b + 8];
  f[b + 8] = f[b + 2];
  f[b + 2] = tmp;
  // Edges
  tmp = f[b + 1];
  f[b + 1] = f[b + 3];
  f[b + 3] = f[b + 7];
  f[b + 7] = f[b + 5];
  f[b + 5] = tmp;
}

// ─── Individual move implementations ────────────────────────────────────────
// Each returns a NEW array. None mutate the input.

function moveU(src) {
  const f = clone(src);
  rotateFaceCW(f, U);
  // F top → R top, R top → B top, B top → L top, L top → F top
  // Mirrors Java moveU(): indices F*9+0..2, R*9+0..2, B*9+0..2, L*9+0..2
  const t0 = f[F*9+0], t1 = f[F*9+1], t2 = f[F*9+2];
  f[F*9+0] = f[R*9+0]; f[F*9+1] = f[R*9+1]; f[F*9+2] = f[R*9+2];
  f[R*9+0] = f[B*9+0]; f[R*9+1] = f[B*9+1]; f[R*9+2] = f[B*9+2];
  f[B*9+0] = f[L*9+0]; f[B*9+1] = f[L*9+1]; f[B*9+2] = f[L*9+2];
  f[L*9+0] = t0;       f[L*9+1] = t1;       f[L*9+2] = t2;
  return f;
}

function moveD(src) {
  const f = clone(src);
  rotateFaceCW(f, D);
  // F bottom → L bottom, L bottom → B bottom, B bottom → R bottom, R bottom → F bottom
  const t0 = f[F*9+6], t1 = f[F*9+7], t2 = f[F*9+8];
  f[F*9+6] = f[L*9+6]; f[F*9+7] = f[L*9+7]; f[F*9+8] = f[L*9+8];
  f[L*9+6] = f[B*9+6]; f[L*9+7] = f[B*9+7]; f[L*9+8] = f[B*9+8];
  f[B*9+6] = f[R*9+6]; f[B*9+7] = f[R*9+7]; f[B*9+8] = f[R*9+8];
  f[R*9+6] = t0;       f[R*9+7] = t1;       f[R*9+8] = t2;
  return f;
}

function moveR(src) {
  const f = clone(src);
  rotateFaceCW(f, R);
  // U right col → F right col, F right col → D right col,
  // D right col → B left col (reversed), B left col (reversed) → U right col
  const tU2 = f[U*9+2], tU5 = f[U*9+5], tU8 = f[U*9+8];
  f[U*9+2] = f[F*9+2]; f[U*9+5] = f[F*9+5]; f[U*9+8] = f[F*9+8];
  f[F*9+2] = f[D*9+2]; f[F*9+5] = f[D*9+5]; f[F*9+8] = f[D*9+8];
  f[D*9+2] = f[B*9+6]; f[D*9+5] = f[B*9+3]; f[D*9+8] = f[B*9+0];
  f[B*9+0] = tU8;      f[B*9+3] = tU5;      f[B*9+6] = tU2;
  return f;
}

function moveL(src) {
  const f = clone(src);
  rotateFaceCW(f, L);
  // U left col → B right col (reversed), B right col → D left col, D left col → F left col, F left col → U left col
  const tU0 = f[U*9+0], tU3 = f[U*9+3], tU6 = f[U*9+6];
  f[U*9+0] = f[B*9+8]; f[U*9+3] = f[B*9+5]; f[U*9+6] = f[B*9+2];
  f[B*9+2] = f[D*9+6]; f[B*9+5] = f[D*9+3]; f[B*9+8] = f[D*9+0];
  f[D*9+0] = f[F*9+0]; f[D*9+3] = f[F*9+3]; f[D*9+6] = f[F*9+6];
  f[F*9+0] = tU0;      f[F*9+3] = tU3;      f[F*9+6] = tU6;
  return f;
}

function moveF(src) {
  const f = clone(src);
  rotateFaceCW(f, F);
  // U bottom → R left col, R left col → D top (reversed), D top → L right col, L right col → U bottom
  const tU6 = f[U*9+6], tU7 = f[U*9+7], tU8 = f[U*9+8];
  f[U*9+6] = f[L*9+8]; f[U*9+7] = f[L*9+5]; f[U*9+8] = f[L*9+2];
  f[L*9+2] = f[D*9+0]; f[L*9+5] = f[D*9+1]; f[L*9+8] = f[D*9+2];
  f[D*9+0] = f[R*9+6]; f[D*9+1] = f[R*9+3]; f[D*9+2] = f[R*9+0];
  f[R*9+0] = tU6;      f[R*9+3] = tU7;      f[R*9+6] = tU8;
  return f;
}

function moveB(src) {
  const f = clone(src);
  rotateFaceCW(f, B);
  // U top → R right col, R right col → D bottom (reversed), D bottom → L left col, L left col → U top
  const tU0 = f[U*9+0], tU1 = f[U*9+1], tU2 = f[U*9+2];
  f[U*9+0] = f[R*9+2]; f[U*9+1] = f[R*9+5]; f[U*9+2] = f[R*9+8];
  f[R*9+2] = f[D*9+8]; f[R*9+5] = f[D*9+7]; f[R*9+8] = f[D*9+6];
  f[D*9+6] = f[L*9+0]; f[D*9+7] = f[L*9+3]; f[D*9+8] = f[L*9+6];
  f[L*9+0] = tU2;      f[L*9+3] = tU1;      f[L*9+6] = tU0;
  return f;
}

// ─── Double moves (compose two CW rotations) ────────────────────────────────

function apply2(moveFn, f) { return moveFn(moveFn(f)); }

// ─── Inverse moves (compose three CW rotations = one CCW) ──────────────────

function apply3(moveFn, f) { return moveFn(moveFn(moveFn(f))); }

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * applyMove(facelets, move)
 *
 * Applies a single named move to a 54-element integer array and returns
 * a NEW array. Exactly mirrors CubeMoves.applyMove() in Java.
 *
 * @param {number[]} facelets - 54-element array (face*9+pos = colorCode 0-5)
 * @param {string}   move     - standard WCA move string
 * @returns {number[]} new 54-element array
 * @throws {Error} if move is unrecognised
 */
export function applyMove(facelets, move) {
  switch (move) {
    case 'U':  return moveU(facelets);
    case "U'": return apply3(moveU, facelets);
    case 'U2': return apply2(moveU, facelets);
    case 'D':  return moveD(facelets);
    case "D'": return apply3(moveD, facelets);
    case 'D2': return apply2(moveD, facelets);
    case 'R':  return moveR(facelets);
    case "R'": return apply3(moveR, facelets);
    case 'R2': return apply2(moveR, facelets);
    case 'L':  return moveL(facelets);
    case "L'": return apply3(moveL, facelets);
    case 'L2': return apply2(moveL, facelets);
    case 'F':  return moveF(facelets);
    case "F'": return apply3(moveF, facelets);
    case 'F2': return apply2(moveF, facelets);
    case 'B':  return moveB(facelets);
    case "B'": return apply3(moveB, facelets);
    case 'B2': return apply2(moveB, facelets);
    default:
      throw new Error(`Unknown move: ${move}`);
  }
}

/**
 * applyMoves(facelets, movesArray)
 *
 * Applies a sequence of moves and returns the resulting state.
 */
export function applyMoves(facelets, movesArray) {
  let current = facelets.slice();
  for (const move of movesArray) {
    current = applyMove(current, move);
  }
  return current;
}

/**
 * isSolved(facelets)
 *
 * Returns true iff all 9 stickers on each face share the same color.
 * Matches CubeState.isSolved() in Java.
 */
export function isSolved(facelets) {
  for (let face = 0; face < 6; face++) {
    const center = facelets[face * 9 + 4];
    for (let pos = 0; pos < 9; pos++) {
      if (facelets[face * 9 + pos] !== center) return false;
    }
  }
  return true;
}

/**
 * computeAllStates(initialFacelets, moves)
 *
 * Returns an array of N+1 states:
 *   states[0] = initialFacelets
 *   states[k] = state after applying moves[0..k-1]
 *
 * All computation is synchronous and client-side only.
 * The backend /api/cube/apply-move is NOT called here —
 * this function is the JavaScript mirror of the Java engine.
 */
export function computeAllStates(initialFacelets, moves) {
  const states = [initialFacelets.slice()];
  let current = initialFacelets.slice();
  for (const move of moves) {
    current = applyMove(current, move);
    states.push(current.slice());
  }
  return states;
}

/**
 * Generates the 54-element facelet array resulting from applying
 * a scramble sequence to a solved cube.
 */
export function getScrambledState(scrambleMoves) {
  const solved = [];
  for (let face = 0; face < 6; face++) {
    for (let pos = 0; pos < 9; pos++) {
      solved.push(face);
    }
  }
  if (!scrambleMoves || typeof scrambleMoves !== 'string' || scrambleMoves.trim().length === 0) {
    return solved;
  }
  const moves = scrambleMoves.trim().split(/\s+/);
  return applyMoves(solved, moves);
}

