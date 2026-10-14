/**
 * orientationGuide.js
 *
 * Professional Rubik's Cube orientation and whole-cube rotation engine.
 *
 * Responsibilities:
 * 1. Maintain dynamic orientation state (Camera-facing, Top, Bottom, Left, Right).
 * 2. Calculate smooth 3D whole-cube rigid-body rotations (Euler angles, axis, and delta).
 * 3. Provide beginner-friendly natural scanning sequence (White -> Green -> Red -> Blue -> Orange -> Yellow).
 * 4. Generate dynamic next-face instructions using confirmed center colors.
 * 5. Provide 90° CW and CCW grid rotation utilities for sticker reorientation.
 */

// Canonical Face Index: 0 = U, 1 = R, 2 = F, 3 = D, 4 = L, 5 = B
export const FACE_KEYS = ['U', 'R', 'F', 'D', 'L', 'B'];

export const CANONICAL_COLORS = [
  { id: 0, key: 'U', name: 'White', hex: '#FFFFFF', darkText: true },
  { id: 1, key: 'R', name: 'Red', hex: '#EF4444', darkText: false },
  { id: 2, key: 'F', name: 'Green', hex: '#22C55E', darkText: false },
  { id: 3, key: 'D', name: 'Yellow', hex: '#FACC15', darkText: true },
  { id: 4, key: 'L', name: 'Orange', hex: '#F97316', darkText: false },
  { id: 5, key: 'B', name: 'Blue', hex: '#3B82F6', darkText: false },
];

/**
 * Recommended ergonomic scanning sequence for beginners:
 * 0 (U - White)  -> Start with White in front, Green pointing down.
 * 2 (F - Green)  -> Tilt forward 90°: White is now on top, Green facing camera!
 * 1 (R - Red)    -> Turn left 90°: White stays on top, Red facing camera!
 * 5 (B - Blue)   -> Turn left 90°: White stays on top, Blue facing camera!
 * 4 (L - Orange) -> Turn left 90°: White stays on top, Orange facing camera!
 * 3 (D - Yellow) -> Tilt upward 90°: Orange on top, Yellow facing camera!
 *
 * Notice: 4 of the 6 faces are scanned with White ALWAYS pointing up, simply turning left!
 */
export const RECOMMENDED_SCAN_SEQUENCE = [0, 2, 1, 5, 4, 3];

/**
 * Canonical 3D Euler angles [x, y, z] for each face when it is facing the camera (+Z)
 * in Three.js standard coordinates (+X=Right, +Y=Up, +Z=Towards camera).
 */
export const FACE_EULER_ANGLES = {
  // U (White) facing +Z: rotate around X by +90° (+PI/2). Back(+Y) is on top, Front(-Y) is pointing down.
  0: [Math.PI / 2, 0, 0],

  // F (Green) facing +Z: default orientation. Up(+Y) is on top, Left(-X) is on left, Right(+X) is on right.
  2: [0, 0, 0],

  // R (Red) facing +Z: rotate around Y by -90° (-PI/2). Up(+Y) is on top, Front(-X) is on left.
  1: [0, -Math.PI / 2, 0],

  // B (Blue) facing +Z: rotate around Y by -180° (-PI). Up(+Y) is on top, Red(-X) is on left.
  5: [0, -Math.PI, 0],

  // L (Orange) facing +Z: rotate around Y by -270° (-3PI/2) or +90° (+PI/2). Up(+Y) on top, Blue(-X) on left.
  4: [0, -3 * Math.PI / 2, 0],

  // D (Yellow) facing +Z: rotate around X by -90° (-PI/2). Front(+Y) is on top, Back(-Y) is pointing down.
  3: [-Math.PI / 2, 0, 0],
};

/**
 * Returns confirmed center color information for a given face.
 * If scanned, uses the confirmed center sticker (index 4); otherwise defaults to canonical.
 */
export function getFaceCenterInfo(faceIndex, scannedFaces = {}) {
  const defaultInfo = CANONICAL_COLORS[faceIndex] || CANONICAL_COLORS[0];
  const faceStickers = scannedFaces[faceIndex];

  if (faceStickers && faceStickers[4]) {
    const centerSticker = faceStickers[4];
    const match = CANONICAL_COLORS.find((c) => c.id === centerSticker.colorId);
    if (match) {
      return {
        ...match,
        name: centerSticker.colorName || match.name,
        hex: centerSticker.hex || match.hex,
        isCustom: match.id !== faceIndex,
      };
    }
  }

  return defaultInfo;
}

/**
 * Returns the face neighbors in physical 3D space when a given face is facing the camera.
 */
export function getFaceOrientation(faceIndex, scannedFaces = {}) {
  const cameraFace = getFaceCenterInfo(faceIndex, scannedFaces);

  // Define adjacent face indices [top, bottom, left, right] for each face
  const adjacentMap = {
    0: { top: 5, bottom: 2, left: 4, right: 1 }, // U: top=B, bot=F, left=L, right=R
    2: { top: 0, bottom: 3, left: 4, right: 1 }, // F: top=U, bot=D, left=L, right=R
    1: { top: 0, bottom: 3, left: 2, right: 5 }, // R: top=U, bot=D, left=F, right=B
    5: { top: 0, bottom: 3, left: 1, right: 4 }, // B: top=U, bot=D, left=R, right=L
    4: { top: 0, bottom: 3, left: 5, right: 2 }, // L: top=U, bot=D, left=B, right=F
    3: { top: 2, bottom: 5, left: 4, right: 1 }, // D: top=F, bot=B, left=L, right=R
  };

  const adj = adjacentMap[faceIndex] || adjacentMap[0];

  return {
    cameraFace,
    topFace: getFaceCenterInfo(adj.top, scannedFaces),
    bottomFace: getFaceCenterInfo(adj.bottom, scannedFaces),
    leftFace: getFaceCenterInfo(adj.left, scannedFaces),
    rightFace: getFaceCenterInfo(adj.right, scannedFaces),
  };
}

/**
 * Calculates the next recommended face to scan after confirming a face.
 * Follows RECOMMENDED_SCAN_SEQUENCE, picking the next unconfirmed face.
 */
export function calculateNextFace(currentFaceIndex, scannedFaces = {}) {
  const currentPos = RECOMMENDED_SCAN_SEQUENCE.indexOf(currentFaceIndex);
  const totalSteps = RECOMMENDED_SCAN_SEQUENCE.length;

  // Try the next faces in recommended sequence
  for (let offset = 1; offset < totalSteps; offset++) {
    const nextIdx = RECOMMENDED_SCAN_SEQUENCE[(currentPos + offset) % totalSteps];
    if (!scannedFaces[nextIdx]) {
      return nextIdx;
    }
  }

  // If all sequence faces are confirmed, check any unconfirmed face 0..5
  for (let f = 0; f < 6; f++) {
    if (!scannedFaces[f]) return f;
  }

  // All 6 faces scanned
  return null;
}

/**
 * Computes exact 3D whole-cube rotation, direction arrow, and guidance copy
 * for transitioning from `fromFaceIndex` to `toFaceIndex`.
 */
export function getRotationGuidance(fromFaceIndex, toFaceIndex, scannedFaces = {}) {
  const fromCenter = getFaceCenterInfo(fromFaceIndex, scannedFaces);
  const toCenter = getFaceCenterInfo(toFaceIndex, scannedFaces);
  const toOrientation = getFaceOrientation(toFaceIndex, scannedFaces);

  const startEuler = [...(FACE_EULER_ANGLES[fromFaceIndex] || [0, 0, 0])];
  let endEuler = [...(FACE_EULER_ANGLES[toFaceIndex] || [0, 0, 0])];

  let direction = 'ROTATE_LEFT';
  let rotationAxis = 'y';
  let rotationAngle = -Math.PI / 2;
  let arrowCurve = 'horizontal-left';
  let instructionTitle = `NEXT: SCAN THE ${toCenter.name.toUpperCase()} FACE`;
  let instructionDetail = `Keep ${toOrientation.topFace.name.toUpperCase()} on top. Rotate the entire cube as shown until ${toCenter.name.toUpperCase()} faces the camera.`;

  // Specific ergonomic transitions:
  if (fromFaceIndex === 0 && toFaceIndex === 2) {
    // White (U) -> Green (F): Tilt forward/down 90°
    direction = 'TILT_DOWN';
    rotationAxis = 'x';
    startEuler[0] = Math.PI / 2;
    endEuler = [0, 0, 0];
    rotationAngle = -Math.PI / 2;
    arrowCurve = 'vertical-down';
    instructionDetail = `Keep ${fromCenter.name.toUpperCase()} on top. Tilt the entire cube forward/downward 90° until ${toCenter.name.toUpperCase()} faces the camera.`;
  } else if (fromFaceIndex === 2 && toFaceIndex === 1) {
    // Green (F) -> Red (R): Rotate left 90°
    direction = 'ROTATE_LEFT';
    rotationAxis = 'y';
    startEuler[1] = 0;
    endEuler = [0, -Math.PI / 2, 0];
    rotationAngle = -Math.PI / 2;
    arrowCurve = 'horizontal-left';
    instructionDetail = `Keep ${toOrientation.topFace.name.toUpperCase()} on top. Rotate the entire cube 90° to the LEFT until ${toCenter.name.toUpperCase()} faces the camera.`;
  } else if (fromFaceIndex === 1 && toFaceIndex === 5) {
    // Red (R) -> Blue (B): Rotate left 90°
    direction = 'ROTATE_LEFT';
    rotationAxis = 'y';
    startEuler[1] = -Math.PI / 2;
    endEuler = [0, -Math.PI, 0];
    rotationAngle = -Math.PI / 2;
    arrowCurve = 'horizontal-left';
    instructionDetail = `Keep ${toOrientation.topFace.name.toUpperCase()} on top. Rotate the entire cube 90° to the LEFT until ${toCenter.name.toUpperCase()} faces the camera.`;
  } else if (fromFaceIndex === 5 && toFaceIndex === 4) {
    // Blue (B) -> Orange (L): Rotate left 90°
    direction = 'ROTATE_LEFT';
    rotationAxis = 'y';
    startEuler[1] = -Math.PI;
    endEuler = [0, -3 * Math.PI / 2, 0];
    rotationAngle = -Math.PI / 2;
    arrowCurve = 'horizontal-left';
    instructionDetail = `Keep ${toOrientation.topFace.name.toUpperCase()} on top. Rotate the entire cube 90° to the LEFT until ${toCenter.name.toUpperCase()} faces the camera.`;
  } else if (fromFaceIndex === 4 && toFaceIndex === 3) {
    // Orange (L) -> Yellow (D): Tilt upward 90°
    direction = 'TILT_UP';
    rotationAxis = 'x';
    startEuler[0] = 0;
    startEuler[1] = Math.PI / 2; // Represent L as +PI/2
    endEuler = [-Math.PI / 2, 0, 0];
    rotationAngle = -Math.PI / 2;
    arrowCurve = 'vertical-up';
    instructionDetail = `Tilt the entire cube 90° UPWARD so the bottom ${toCenter.name.toUpperCase()} face points at the camera.`;
  } else if (toFaceIndex === 0) {
    // Any face -> White (U)
    direction = 'TILT_DOWN';
    rotationAxis = 'x';
    rotationAngle = Math.PI / 2;
    arrowCurve = 'vertical-down';
    instructionDetail = `Tilt the cube so ${toCenter.name.toUpperCase()} points directly at the camera.`;
  } else if (toFaceIndex === 3) {
    // Any face -> Yellow (D)
    direction = 'TILT_UP';
    rotationAxis = 'x';
    rotationAngle = -Math.PI / 2;
    arrowCurve = 'vertical-up';
    instructionDetail = `Tilt the cube 90° UPWARD until ${toCenter.name.toUpperCase()} points at the camera.`;
  } else {
    // General horizontal rotation
    direction = 'ROTATE_LEFT';
    rotationAxis = 'y';
    arrowCurve = 'horizontal-left';
    instructionDetail = `Keep ${toOrientation.topFace.name.toUpperCase()} on top. Rotate the cube until ${toCenter.name.toUpperCase()} faces the camera.`;
  }

  return {
    fromFace: fromCenter,
    toFace: toCenter,
    topFace: toOrientation.topFace,
    bottomFace: toOrientation.bottomFace,
    leftFace: toOrientation.leftFace,
    rightFace: toOrientation.rightFace,
    startEuler,
    endEuler,
    rotationAxis,
    rotationAngle,
    direction,
    arrowCurve,
    instructionTitle,
    instructionDetail,
  };
}

/**
 * Rotates a 3x3 array of 9 stickers by 90° Clockwise or Counter-Clockwise.
 * Used when a physical cube face was scanned rotated (e.g. holding Red on top instead of White).
 *
 * 3x3 indices:
 *   0 1 2
 *   3 4 5
 *   6 7 8
 *
 * CW Mapping:
 *   0->2, 1->5, 2->8, 3->1, 4->4, 5->7, 6->0, 7->3, 8->6
 *   newArray[i] = oldArray[cwMap[i]]
 *
 * CCW Mapping:
 *   0->6, 1->3, 2->0, 3->7, 4->4, 5->1, 6->8, 7->5, 8->2
 */
const CW_PERM = [6, 3, 0, 7, 4, 1, 8, 5, 2];
const CCW_PERM = [2, 5, 8, 1, 4, 7, 0, 3, 6];

export function rotateGrid90(stickers, direction = 'CW') {
  if (!stickers || stickers.length !== 9) return stickers;

  const perm = direction === 'CW' ? CW_PERM : CCW_PERM;
  const rotated = new Array(9);

  for (let newIdx = 0; newIdx < 9; newIdx++) {
    const oldIdx = perm[newIdx];
    const sourceSticker = stickers[oldIdx];
    rotated[newIdx] = {
      ...sourceSticker,
      index: newIdx,
      row: Math.floor(newIdx / 3),
      col: newIdx % 3,
      source: 'user', // Marked as confirmed by user rotation
    };
  }

  return rotated;
}
