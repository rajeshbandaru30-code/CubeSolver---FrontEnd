import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  RotateCcw, Camera, ArrowLeft, ArrowRight, Check, Sparkles,
  Compass, ChevronRight, FastForward, Play,
} from 'lucide-react';
import { COLOR_MAP, CHAR_COLOR_MAP } from '../CubeVisualizer';
import { getRotationGuidance } from '../../engine/orientationGuide';

// ── Shared Sticker Geometries ──
const xStickerGeo = new THREE.BoxGeometry(0.024, 0.82, 0.82);
const yStickerGeo = new THREE.BoxGeometry(0.82, 0.024, 0.82);
const zStickerGeo = new THREE.BoxGeometry(0.82, 0.82, 0.024);

const FACE_OFFSET = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

// ── Single Cubie with Rounded Edges & Beveled Stickers ──
function RotatingCubie({ position, colors }) {
  return (
    <group position={position}>
      {/* Matte black cubie core */}
      <RoundedBox args={[0.93, 0.93, 0.93]} radius={0.065} smoothness={3}>
        <meshStandardMaterial color="#0f131f" roughness={0.55} metalness={0.12} />
      </RoundedBox>

      {/* Stickers */}
      {colors.R && (
        <mesh geometry={xStickerGeo} position={[0.468, 0, 0]}>
          <meshStandardMaterial color={colors.R} roughness={0.18} metalness={0.05} />
        </mesh>
      )}
      {colors.L && (
        <mesh geometry={xStickerGeo} position={[-0.468, 0, 0]}>
          <meshStandardMaterial color={colors.L} roughness={0.18} metalness={0.05} />
        </mesh>
      )}
      {colors.U && (
        <mesh geometry={yStickerGeo} position={[0, 0.468, 0]}>
          <meshStandardMaterial color={colors.U} roughness={0.18} metalness={0.05} />
        </mesh>
      )}
      {colors.D && (
        <mesh geometry={yStickerGeo} position={[0, -0.468, 0]}>
          <meshStandardMaterial color={colors.D} roughness={0.18} metalness={0.05} />
        </mesh>
      )}
      {colors.F && (
        <mesh geometry={zStickerGeo} position={[0, 0, 0.468]}>
          <meshStandardMaterial color={colors.F} roughness={0.18} metalness={0.05} />
        </mesh>
      )}
      {colors.B && (
        <mesh geometry={zStickerGeo} position={[0, 0, -0.468]}>
          <meshStandardMaterial color={colors.B} roughness={0.18} metalness={0.05} />
        </mesh>
      )}
    </group>
  );
}

// ── 3D Rotating Rigid Cube Canvas Scene ──
function RigidCubeScene({
  faceletColors,
  startEuler,
  endEuler,
  animKey,
  onComplete,
  reducedMotion = false,
}) {
  const cubeGroupRef = useRef();
  const animStateRef = useRef({
    startTime: performance.now(),
    duration: reducedMotion ? 1 : 1250, // 1.25s smooth rotation
    completed: false,
  });

  const cubies = useMemo(() => {
    const list = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          list.push({
            x, y, z,
            colors: getCubieColors(x, y, z, faceletColors),
            key: `${x}${y}${z}`,
          });
        }
      }
    }
    return list;
  }, [faceletColors]);

  useEffect(() => {
    animStateRef.current = {
      startTime: performance.now(),
      duration: reducedMotion ? 1 : 1250,
      completed: false,
    };
    if (cubeGroupRef.current) {
      cubeGroupRef.current.rotation.set(...startEuler);
    }
  }, [animKey, startEuler, reducedMotion]);

  useFrame(() => {
    if (!cubeGroupRef.current) return;

    if (reducedMotion) {
      cubeGroupRef.current.rotation.set(...endEuler);
      if (!animStateRef.current.completed) {
        animStateRef.current.completed = true;
        if (onComplete) onComplete();
      }
      return;
    }

    const { startTime, duration, completed } = animStateRef.current;
    if (completed) {
      cubeGroupRef.current.rotation.set(...endEuler);
      return;
    }

    const now = performance.now();
    const elapsed = now - startTime;
    const progress = Math.min(1, Math.max(0, elapsed / duration));
    const eased = easeInOutCubic(progress);

    // Interpolate Euler angles smoothly
    cubeGroupRef.current.rotation.x = startEuler[0] + (endEuler[0] - startEuler[0]) * eased;
    cubeGroupRef.current.rotation.y = startEuler[1] + (endEuler[1] - startEuler[1]) * eased;
    cubeGroupRef.current.rotation.z = startEuler[2] + (endEuler[2] - startEuler[2]) * eased;

    if (progress >= 1) {
      animStateRef.current.completed = true;
      cubeGroupRef.current.rotation.set(...endEuler);
      if (onComplete) onComplete();
    }
  });

  return (
    <group>
      {/* Ground shadow */}
      <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} />
      </mesh>

      {/* Whole Cube Rigid Body */}
      <group ref={cubeGroupRef}>
        {cubies.map((c) => (
          <RotatingCubie key={c.key} position={[c.x, c.y, c.z]} colors={c.colors} />
        ))}
      </group>
    </group>
  );
}

/**
 * RotationGuidanceScreen
 *
 * Dedicated 3D whole-cube rotation tutorial screen shown immediately after
 * confirming a face:
 * - 3D animation of the virtual cube smoothly turning into the next scanning orientation
 * - Animated curved directional arrow indicating exact physical hand motion
 * - Dynamic color identities (White, Green, Red, Yellow, etc.) computed from observed centers
 * - Clear badges for TOP color, CAMERA-FACING color, and CONFIRMED face
 * - Replay, Skip, and "I'm Ready — Open Camera" controls
 */
export default function RotationGuidanceScreen({
  fromFaceIndex,
  toFaceIndex,
  scannedFaces = {},
  onReady,
  onBackToPrevious,
  stepNumber = 2,
  totalSteps = 6,
}) {
  const [animKey, setAnimKey] = useState(0);
  const [isAnimationFinished, setIsAnimationFinished] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const guidance = useMemo(() => {
    return getRotationGuidance(fromFaceIndex, toFaceIndex, scannedFaces);
  }, [fromFaceIndex, toFaceIndex, scannedFaces]);

  // Construct standard 54-facelet array using scanned faces where available
  const faceletColors = useMemo(() => {
    const arr = new Array(54).fill(0);
    for (let face = 0; face < 6; face++) {
      const stickers = scannedFaces[face];
      for (let pos = 0; pos < 9; pos++) {
        const idx = face * 9 + pos;
        if (stickers && stickers[pos]) {
          arr[idx] = stickers[pos].colorId;
        } else {
          arr[idx] = face; // default facelet color
        }
      }
    }
    return arr;
  }, [scannedFaces]);

  const handleReplay = useCallback(() => {
    setIsAnimationFinished(false);
    setAnimKey((prev) => prev + 1);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimationFinished(true);
  }, []);

  const handleSkip = useCallback(() => {
    setReducedMotion(true);
    setIsAnimationFinished(true);
  }, []);

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        position: 'relative',
        borderRadius: '24px',
        background: 'rgba(11, 16, 32, 0.94)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(10, 132, 255, 0.35)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75)',
        padding: '20px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      {/* Top Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '280px',
          height: '140px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${guidance.toFace.hex}33 0%, transparent 70%)`,
          filter: 'blur(35px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
        <button
          type="button"
          onClick={onBackToPrevious}
          className="btn-secondary"
          style={{
            padding: '6px 10px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title={`Back to ${guidance.fromFace.name} Face`}
        >
          <ArrowLeft size={14} /> <span>Back</span>
        </button>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              color: '#5AC8FA',
              background: 'rgba(10, 132, 255, 0.15)',
              padding: '3px 9px',
              borderRadius: '100px',
              border: '1px solid rgba(10, 132, 255, 0.3)',
            }}
          >
            Step {stepNumber} of {totalSteps}: Rotate Cube
          </span>
        </div>

        {/* Replay or Skip */}
        <button
          type="button"
          onClick={handleReplay}
          className="btn-secondary"
          style={{
            padding: '6px 10px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Replay 3D rotation animation"
        >
          <RotateCcw size={14} /> <span>Replay</span>
        </button>
      </div>

      {/* Confirmed Previous Face Celebration Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'rgba(48, 209, 88, 0.12)',
          border: '1px solid rgba(48, 209, 88, 0.35)',
          borderRadius: '12px',
          padding: '8px 14px',
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#30D158',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={11} color="#0B1020" strokeWidth={3} />
        </div>
        <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#30D158', letterSpacing: '0.02em' }}>
          {guidance.fromFace.name.toUpperCase()} FACE SCANNED ✓
        </span>
      </div>

      {/* 3D Visualizer Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '240px',
          background: 'radial-gradient(circle at 50% 50%, rgba(17, 24, 39, 0.6) 0%, rgba(11, 16, 32, 0.95) 100%)',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Floating Orientation Pill: Top Face */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: 'rgba(11, 16, 32, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '100px',
            padding: '3px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontWeight: '700',
            color: '#F8FAFF',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: guidance.topFace.hex,
              boxShadow: `0 0 6px ${guidance.topFace.hex}`,
            }}
          />
          <span>KEEP ON TOP: {guidance.topFace.name.toUpperCase()}</span>
        </div>

        {/* 3D Directional Overlay Arrow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {guidance.direction === 'ROTATE_LEFT' && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '180px',
                height: '40px',
                borderTop: '3px dashed #5AC8FA',
                borderRadius: '50%',
                opacity: 0.85,
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-7px',
                  left: '6px',
                  width: 0,
                  height: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: '12px solid #5AC8FA',
                }}
              />
            </div>
          )}

          {guidance.direction === 'TILT_DOWN' && (
            <div
              style={{
                position: 'absolute',
                right: '30px',
                height: '140px',
                width: '35px',
                borderRight: '3px dashed #5AC8FA',
                borderRadius: '50%',
                opacity: 0.85,
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '-6px',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '12px solid #5AC8FA',
                }}
              />
            </div>
          )}

          {guidance.direction === 'TILT_UP' && (
            <div
              style={{
                position: 'absolute',
                right: '30px',
                height: '140px',
                width: '35px',
                borderRight: '3px dashed #5AC8FA',
                borderRadius: '50%',
                opacity: 0.85,
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '-6px',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '12px solid #5AC8FA',
                }}
              />
            </div>
          )}
        </div>

        {/* 3D Canvas */}
        <Canvas
          camera={{ position: [0, 0, 5], fov: 46 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={1.3} />
          <directionalLight position={[4, 6, 5]} intensity={1.5} />
          <directionalLight position={[-4, -3, -4]} intensity={0.6} />

          <RigidCubeScene
            faceletColors={faceletColors}
            startEuler={guidance.startEuler}
            endEuler={guidance.endEuler}
            animKey={animKey}
            onComplete={handleAnimationComplete}
            reducedMotion={reducedMotion}
          />
        </Canvas>

        {/* Floating Orientation Pill: Front / Camera Face */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: 'rgba(11, 16, 32, 0.9)',
            backdropFilter: 'blur(8px)',
            border: `1.5px solid ${guidance.toFace.hex}`,
            borderRadius: '100px',
            padding: '3px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.74rem',
            fontWeight: '800',
            color: '#F8FAFF',
            boxShadow: `0 0 12px ${guidance.toFace.hex}44`,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: guidance.toFace.hex,
              boxShadow: `0 0 8px ${guidance.toFace.hex}`,
            }}
          />
          <span>FACING CAMERA: {guidance.toFace.name.toUpperCase()}</span>
        </div>
      </div>

      {/* Prominent Next Face Instruction Card */}
      <div
        style={{
          background: 'rgba(17, 24, 39, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              background: guidance.toFace.hex,
              boxShadow: `0 0 10px ${guidance.toFace.hex}`,
            }}
          />
          <h2
            style={{
              fontSize: '1.08rem',
              fontWeight: '900',
              color: guidance.toFace.hex,
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            {guidance.instructionTitle}
          </h2>
        </div>

        <p
          style={{
            fontSize: '0.84rem',
            color: '#F8FAFF',
            lineHeight: '1.45',
            margin: 0,
            fontWeight: '500',
          }}
        >
          {guidance.instructionDetail}
        </p>
      </div>

      {/* Primary Action Button: I'm Ready — Open Camera */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={onReady}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '16px',
            fontSize: '0.98rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '9px',
            background: 'linear-gradient(135deg, #0A84FF 0%, #0066cc 100%)',
            boxShadow: '0 8px 25px rgba(10, 132, 255, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <Camera size={18} />
          <span>I'm Ready — Open Camera</span>
          <ChevronRight size={18} />
        </button>

        {/* Supporting actions: Replay and Back */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleReplay}
            className="btn-secondary"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={14} /> Replay Animation
          </button>

          <button
            type="button"
            onClick={onBackToPrevious}
            className="btn-secondary"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={14} /> Back to {guidance.fromFace.name}
          </button>
        </div>
      </div>
    </div>
  );
}
