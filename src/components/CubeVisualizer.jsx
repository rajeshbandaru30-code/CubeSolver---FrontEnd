import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

/**
 * CubeVisualizer
 *
 * Commercial-grade 3D Rubik's Cube renderer.
 * Features:
 * - Rounded cubie geometries with dark matte plastic finish
 * - Realistic beveled vinyl stickers with slight depth
 * - Balanced multi-point studio lighting with subtle colored rim lights
 * - Ground contact ambient shadow / glow ring
 * - Physical 3D layer animation
 * - Solved celebration glow pulse
 */

// ── Color Maps (WCA / CubeState.java standard) ──
export const COLOR_MAP = {
  0: '#FFFFFF', // 0 = U = White
  1: '#EF4444', // 1 = R = Red
  2: '#22C55E', // 2 = F = Green
  3: '#FACC15', // 3 = D = Yellow
  4: '#F97316', // 4 = L = Orange
  5: '#3B82F6', // 5 = B = Blue
};

export const CHAR_COLOR_MAP = {
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

const FACE_OFFSET = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };

// Shared Sticker Geometries for 54 facelets
const xStickerGeo = new THREE.BoxGeometry(0.024, 0.82, 0.82);
const yStickerGeo = new THREE.BoxGeometry(0.82, 0.024, 0.82);
const zStickerGeo = new THREE.BoxGeometry(0.82, 0.82, 0.024);

// ── Cubie Component ──
function Cubie({ position, colors }) {
  return (
    <group position={position}>
      {/* Matte black core cubie with rounded beveled edges */}
      <RoundedBox args={[0.93, 0.93, 0.93]} radius={0.065} smoothness={3}>
        <meshStandardMaterial color="#0f131f" roughness={0.55} metalness={0.12} />
      </RoundedBox>

      {/* Stickers - positioned on outer surface with vibrant tone & slight sheen */}
      {/* +X (Right) */}
      {colors.R && (
        <mesh geometry={xStickerGeo} position={[0.468, 0, 0]}>
          <meshStandardMaterial color={colors.R} roughness={0.15} metalness={0.04} />
        </mesh>
      )}

      {/* -X (Left) */}
      {colors.L && (
        <mesh geometry={xStickerGeo} position={[-0.468, 0, 0]}>
          <meshStandardMaterial color={colors.L} roughness={0.15} metalness={0.04} />
        </mesh>
      )}

      {/* +Y (Up) */}
      {colors.U && (
        <mesh geometry={yStickerGeo} position={[0, 0.468, 0]}>
          <meshStandardMaterial color={colors.U} roughness={0.15} metalness={0.04} />
        </mesh>
      )}

      {/* -Y (Down) */}
      {colors.D && (
        <mesh geometry={yStickerGeo} position={[0, -0.468, 0]}>
          <meshStandardMaterial color={colors.D} roughness={0.15} metalness={0.04} />
        </mesh>
      )}

      {/* +Z (Front) */}
      {colors.F && (
        <mesh geometry={zStickerGeo} position={[0, 0, 0.468]}>
          <meshStandardMaterial color={colors.F} roughness={0.15} metalness={0.04} />
        </mesh>
      )}

      {/* -Z (Back) */}
      {colors.B && (
        <mesh geometry={zStickerGeo} position={[0, 0, -0.468]}>
          <meshStandardMaterial color={colors.B} roughness={0.15} metalness={0.04} />
        </mesh>
      )}
    </group>
  );
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function getMoveConfig(move) {
  if (!move || typeof move !== 'string') return null;
  const face = move[0].toUpperCase();
  const modifier = move.slice(1);

  let axis = 'y';
  let layerFilter = () => false;
  let baseSign = -1;

  switch (face) {
    case 'U':
      axis = 'y';
      layerFilter = (x, y, z) => y === 1;
      baseSign = -1;
      break;
    case 'D':
      axis = 'y';
      layerFilter = (x, y, z) => y === -1;
      baseSign = 1;
      break;
    case 'R':
      axis = 'x';
      layerFilter = (x, y, z) => x === 1;
      baseSign = -1;
      break;
    case 'L':
      axis = 'x';
      layerFilter = (x, y, z) => x === -1;
      baseSign = 1;
      break;
    case 'F':
      axis = 'z';
      layerFilter = (x, y, z) => z === 1;
      baseSign = -1;
      break;
    case 'B':
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

function getFaceletHex(face, pos, faceletColors) {
  if (!faceletColors || faceletColors.length !== 54) {
    return COLOR_MAP[FACE_OFFSET[face] / 9];
  }
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
  return COLOR_MAP[FACE_OFFSET[face] / 9] || '#FFFFFF';
}

function getCubieColors(x, y, z, faceletColors) {
  const colors = {};

  if (y === 1) {
    const row = z + 1;
    const col = x + 1;
    colors.U = getFaceletHex('U', row * 3 + col, faceletColors);
  }
  if (y === -1) {
    const row = 1 - z;
    const col = x + 1;
    colors.D = getFaceletHex('D', row * 3 + col, faceletColors);
  }
  if (z === 1) {
    const row = 1 - y;
    const col = x + 1;
    colors.F = getFaceletHex('F', row * 3 + col, faceletColors);
  }
  if (z === -1) {
    const row = 1 - y;
    const col = 1 - x;
    colors.B = getFaceletHex('B', row * 3 + col, faceletColors);
  }
  if (x === 1) {
    const row = 1 - y;
    const col = 1 - z;
    colors.R = getFaceletHex('R', row * 3 + col, faceletColors);
  }
  if (x === -1) {
    const row = 1 - y;
    const col = z + 1;
    colors.L = getFaceletHex('L', row * 3 + col, faceletColors);
  }

  return colors;
}

// ── 3D Scene with physics layer rotation ──
function RubiksCube3D({ faceletColors, animatingMove, onAnimationComplete, autoRotate = false, isSolved = false }) {
  const rootRef = useRef();
  const rotatingGroupRef = useRef();

  const moveConfig = useMemo(() => {
    return animatingMove ? getMoveConfig(animatingMove.move) : null;
  }, [animatingMove?.move]);

  const { stationaryCubies, rotatingCubies } = useMemo(() => {
    const stationary = [];
    const rotating = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const colors = getCubieColors(x, y, z, faceletColors);
          const cubie = { x, y, z, colors, key: `${x}${y}${z}` };

          if (moveConfig && moveConfig.layerFilter(x, y, z)) {
            rotating.push(cubie);
          } else {
            stationary.push(cubie);
          }
        }
      }
    }
    return { stationaryCubies: stationary, rotatingCubies: rotating };
  }, [faceletColors, moveConfig]);

  const animRef = useRef({
    active: false,
    startTime: 0,
    duration: 550,
    axis: 'y',
    targetAngle: 0,
    completed: false,
  });

  React.useEffect(() => {
    if (animatingMove && animatingMove.move && moveConfig) {
      animRef.current = {
        active: true,
        startTime: performance.now(),
        duration: animatingMove.duration || 550,
        axis: moveConfig.axis,
        targetAngle: moveConfig.targetAngle,
        completed: false,
      };
      if (rotatingGroupRef.current) {
        rotatingGroupRef.current.rotation.set(0, 0, 0);
      }
    } else {
      animRef.current.active = false;
      if (rotatingGroupRef.current) {
        rotatingGroupRef.current.rotation.set(0, 0, 0);
      }
    }
  }, [animatingMove?.id, moveConfig]);

  useFrame((_, delta) => {
    if (rootRef.current) {
      if (autoRotate) {
        rootRef.current.rotation.y += delta * 0.45;
        // Subtle isometric tilt so Top (white), Front (green), and Right (red) faces are all visible
        const t = performance.now() * 0.001;
        rootRef.current.rotation.x = 0.36 + Math.sin(t * 0.4) * 0.03;
      } else if (animatingMove) {
        rootRef.current.rotation.x = 0.35;
        rootRef.current.rotation.y = -0.55;
      } else {
        // Idle breathing motion
        const t = performance.now() * 0.001;
        rootRef.current.rotation.y = Math.sin(t * 0.35) * 0.04 - 0.55;
        rootRef.current.rotation.x = Math.sin(t * 0.25) * 0.03 + 0.35;
      }
    }

    if (animRef.current.active && rotatingGroupRef.current && !animRef.current.completed) {
      const now = performance.now();
      const elapsed = now - animRef.current.startTime;
      const progress = Math.min(1, Math.max(0, elapsed / animRef.current.duration));
      const eased = easeInOutCubic(progress);

      const currentAngle = animRef.current.targetAngle * eased;
      rotatingGroupRef.current.rotation[animRef.current.axis] = currentAngle;

      if (progress >= 1) {
        animRef.current.completed = true;
        rotatingGroupRef.current.rotation[animRef.current.axis] = animRef.current.targetAngle;
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    }
  });

  return (
    <group ref={rootRef}>
      {/* Solved celebration subtle glow ring */}
      {isSolved && (
        <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2.2, 32]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Ground contact shadow disc */}
      <mesh position={[0, -1.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} />
      </mesh>

      {/* Stationary cubies */}
      <group>
        {stationaryCubies.map((c) => (
          <Cubie key={c.key} position={[c.x, c.y, c.z]} colors={c.colors} />
        ))}
      </group>

      {/* Rotating layer cubies */}
      <group ref={rotatingGroupRef}>
        {rotatingCubies.map((c) => (
          <Cubie key={c.key} position={[c.x, c.y, c.z]} colors={c.colors} />
        ))}
      </group>
    </group>
  );
}

// ── Public Component ──
export default function CubeVisualizer({
  facelets,
  stateString,
  animatingMove = null,
  onAnimationComplete = null,
  height = 380,
  autoRotate = false,
  isSolved = false,
  enableOrbit = true,
  enableZoom = false,
}) {
  const faceletColors = useMemo(() => {
    if (facelets && facelets.length === 54) {
      return facelets.map((code, idx) => {
        if (typeof code === 'number' && COLOR_MAP[code]) {
          return COLOR_MAP[code];
        }
        if (typeof code === 'string') {
          if (code.startsWith('#')) return code;
          const upper = code.toUpperCase();
          if (CHAR_COLOR_MAP[upper]) return CHAR_COLOR_MAP[upper];
        }
        const face = Math.floor(idx / 9);
        return COLOR_MAP[face] || '#FFFFFF';
      });
    }
    if (stateString && stateString.length === 54) {
      return stateString.split('').map((ch, idx) => {
        const upper = ch.toUpperCase();
        if (CHAR_COLOR_MAP[upper]) return CHAR_COLOR_MAP[upper];
        const face = Math.floor(idx / 9);
        return COLOR_MAP[face] || '#FFFFFF';
      });
    }
    const solved = [];
    for (let face = 0; face < 6; face++) {
      for (let pos = 0; pos < 9; pos++) {
        solved.push(COLOR_MAP[face]);
      }
    }
    return solved;
  }, [facelets, stateString]);

  return (
    <div
      style={{
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 40%, rgba(30, 41, 59, 0.4) 0%, rgba(8, 11, 20, 0.6) 80%)',
      }}
    >
      <Canvas
        camera={{ position: [3.8, 3.8, 3.8], fov: 44 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Multi-point studio lighting for optimal visibility */}
        <ambientLight intensity={1.1} />
        {/* Key light */}
        <directionalLight position={[7, 12, 7]} intensity={1.4} />
        {/* Fill light */}
        <directionalLight position={[-7, -8, -7]} intensity={0.7} />
        {/* Rim / backlight from left with subtle cyan glow */}
        <directionalLight position={[-6, 7, 7]} intensity={0.8} color="#38bdf8" />
        {/* Warm bottom fill */}
        <directionalLight position={[6, -6, -6]} intensity={0.5} color="#f59e0b" />

        <RubiksCube3D
          faceletColors={faceletColors}
          animatingMove={animatingMove}
          onAnimationComplete={onAnimationComplete}
          autoRotate={autoRotate}
          isSolved={isSolved}
        />

        {enableOrbit && (
          <OrbitControls
            enableZoom={enableZoom}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.06}
            minPolarAngle={Math.PI / 10}
            maxPolarAngle={Math.PI * 0.75}
          />
        )}
      </Canvas>
    </div>
  );
}
