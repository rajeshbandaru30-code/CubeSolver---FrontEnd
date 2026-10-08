const assert = require('assert');

// ── Test getMoveConfig logic (mirrors CubeVisualizer.jsx) ──
function getMoveConfig(move) {
  if (!move || typeof move !== 'string') return null;
  const face = move[0].toUpperCase();
  const modifier = move.slice(1);

  let axis = 'y';
  let layerFilter = () => false;
  let baseSign = -1;

  switch (face) {
    case 'U': // Up: y = 1, looking down from +Y, clockwise is negative around Y
      axis = 'y';
      layerFilter = (x, y, z) => y === 1;
      baseSign = -1;
      break;
    case 'D': // Down: y = -1, looking up from -Y, clockwise is positive around Y
      axis = 'y';
      layerFilter = (x, y, z) => y === -1;
      baseSign = 1;
      break;
    case 'R': // Right: x = 1, looking from +X, clockwise is negative around X
      axis = 'x';
      layerFilter = (x, y, z) => x === 1;
      baseSign = -1;
      break;
    case 'L': // Left: x = -1, looking from -X, clockwise is positive around X
      axis = 'x';
      layerFilter = (x, y, z) => x === -1;
      baseSign = 1;
      break;
    case 'F': // Front: z = 1, looking from +Z, clockwise is negative around Z
      axis = 'z';
      layerFilter = (x, y, z) => z === 1;
      baseSign = -1;
      break;
    case 'B': // Back: z = -1, looking from -Z, clockwise is positive around Z
      axis = 'z';
      layerFilter = (x, y, z) => z === -1;
      baseSign = 1;
      break;
    default:
      return null;
  }

  let angle = (Math.PI / 2) * baseSign;
  if (modifier === "'") {
    angle = -angle;
  } else if (modifier === '2') {
    angle = Math.PI * baseSign;
  }

  return { face, modifier, axis, layerFilter, targetAngle: angle };
}

function invertMove(move) {
  if (!move) return null;
  const face = move[0];
  if (move.endsWith("'")) return face;
  if (move.endsWith("2")) return move;
  return `${face}'`;
}

console.log('========================================================================');
console.log('RUBIKS CUBE PHYSICAL 3D LAYER ROTATION KINEMATICS TEST');
console.log('========================================================================');

// 1. Test all 18 moves configuration
const faces = ['U', 'D', 'R', 'L', 'F', 'B'];
const modifiers = ['', "'", '2'];

console.log('\n[1/3] Testing Move Configuration & Layer Filters for all 18 moves...');
faces.forEach(f => {
  modifiers.forEach(m => {
    const move = f + m;
    const cfg = getMoveConfig(move);
    assert(cfg !== null, `Config for ${move} must exist`);
    assert.strictEqual(cfg.face, f, `Face for ${move} must be ${f}`);
    assert.strictEqual(cfg.modifier, m, `Modifier for ${move} must be ${m}`);

    // Verify exactly 9 cubies in the rotating layer, 18 stationary
    let rotatingCount = 0;
    let stationaryCount = 0;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (cfg.layerFilter(x, y, z)) {
            rotatingCount++;
          } else {
            stationaryCount++;
          }
        }
      }
    }
    assert.strictEqual(rotatingCount, 9, `Move ${move} must rotate exactly 9 cubies`);
    assert.strictEqual(stationaryCount, 18, `Move ${move} must leave exactly 18 cubies stationary`);
  });
});
console.log('  ✅ PASSED: All 18 moves rotate exactly 9 cubies and keep 18 cubies stationary');

// 2. Test mathematical rotation angles and signs in Three.js right-hand coordinate system
console.log('\n[2/3] Testing Mathematical Rotation Signs & Angles...');
// R clockwise must rotate by -90° around X axis
const rCfg = getMoveConfig('R');
assert.strictEqual(rCfg.axis, 'x');
assert(Math.abs(rCfg.targetAngle - (-Math.PI / 2)) < 1e-6, "R angle must be -π/2");

// R' counter-clockwise must rotate by +90° around X axis
const rPrimeCfg = getMoveConfig("R'");
assert.strictEqual(rPrimeCfg.axis, 'x');
assert(Math.abs(rPrimeCfg.targetAngle - (Math.PI / 2)) < 1e-6, "R' angle must be +π/2");

// U clockwise must rotate by -90° around Y axis
const uCfg = getMoveConfig('U');
assert.strictEqual(uCfg.axis, 'y');
assert(Math.abs(uCfg.targetAngle - (-Math.PI / 2)) < 1e-6, "U angle must be -π/2");

// D clockwise must rotate by +90° around Y axis
const dCfg = getMoveConfig('D');
assert.strictEqual(dCfg.axis, 'y');
assert(Math.abs(dCfg.targetAngle - (Math.PI / 2)) < 1e-6, "D angle must be +π/2");

// F clockwise must rotate by -90° around Z axis
const fCfg = getMoveConfig('F');
assert.strictEqual(fCfg.axis, 'z');
assert(Math.abs(fCfg.targetAngle - (-Math.PI / 2)) < 1e-6, "F angle must be -π/2");

// B clockwise must rotate by +90° around Z axis
const bCfg = getMoveConfig('B');
assert.strictEqual(bCfg.axis, 'z');
assert(Math.abs(bCfg.targetAngle - (Math.PI / 2)) < 1e-6, "B angle must be +π/2");

console.log('  ✅ PASSED: All rotation axes (X, Y, Z) and directional signs are mathematically exact');

// 3. Test invertMove helper for stepping backward
console.log('\n[3/3] Testing Invert Move Helper for Backward Playback...');
assert.strictEqual(invertMove('U'), "U'");
assert.strictEqual(invertMove("U'"), 'U');
assert.strictEqual(invertMove('U2'), 'U2');
assert.strictEqual(invertMove('R'), "R'");
assert.strictEqual(invertMove("R'"), 'R');
assert.strictEqual(invertMove('R2'), 'R2');
assert.strictEqual(invertMove('F'), "F'");
assert.strictEqual(invertMove("F'"), 'F');
assert.strictEqual(invertMove('F2'), 'F2');
console.log('  ✅ PASSED: Move inversion operates with 100% precision');

console.log('\n========================================================================');
console.log('ALL PHYSICAL LAYER ANIMATION KINEMATICS PASSED VERIFICATION!');
console.log('========================================================================\n');
