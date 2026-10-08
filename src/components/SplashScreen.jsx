import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// ── Animated Rubik's Cube for Splash ──
function SplashCube({ spin, scaleIn }) {
  const cubeRef = useRef();
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (!cubeRef.current || !groupRef.current) return;

    if (spin) {
      cubeRef.current.rotation.y += delta * 1.2;
      cubeRef.current.rotation.x += delta * 0.6;
      cubeRef.current.rotation.z += delta * 0.3;
    } else {
      // Idle slow rotation
      const t = state.clock.elapsedTime;
      cubeRef.current.rotation.y = t * 0.5 + Math.sin(t * 0.3) * 0.2;
      cubeRef.current.rotation.x = 0.35 + Math.sin(t * 0.2) * 0.08;
    }

    // Scale in animation
    if (scaleIn) {
      const s = THREE.MathUtils.lerp(groupRef.current.scale.x, 1, delta * 4);
      groupRef.current.scale.setScalar(s);
    }
  });

  const FACE_COLORS = [
    '#F8FAFF', // Up - White
    '#FF3B30', // Right - Red
    '#30D158', // Front - Green
    '#FFD60A', // Down - Yellow
    '#FF9500', // Left - Orange
    '#0A84FF', // Back - Blue
  ];

  const cubies = React.useMemo(() => {
    const list = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          list.push({ x, y, z, key: `${x}${y}${z}` });
        }
      }
    }
    return list;
  }, []);

  return (
    <group ref={groupRef} scale={scaleIn ? 0.01 : 1}>
      <group ref={cubeRef}>
        {cubies.map(({ x, y, z, key }) => (
          <group key={key} position={[x * 0.97, y * 0.97, z * 0.97]}>
            <RoundedBox args={[0.91, 0.91, 0.91]} radius={0.07} smoothness={3}>
              <meshStandardMaterial color="#0d1626" roughness={0.4} metalness={0.15} />
            </RoundedBox>
            {/* Stickers */}
            {y === 1 && (
              <mesh position={[0, 0.46, 0]}>
                <boxGeometry args={[0.76, 0.022, 0.76]} />
                <meshStandardMaterial color={FACE_COLORS[0]} roughness={0.12} metalness={0.02} />
              </mesh>
            )}
            {x === 1 && (
              <mesh position={[0.46, 0, 0]}>
                <boxGeometry args={[0.022, 0.76, 0.76]} />
                <meshStandardMaterial color={FACE_COLORS[1]} roughness={0.12} metalness={0.02} />
              </mesh>
            )}
            {z === 1 && (
              <mesh position={[0, 0, 0.46]}>
                <boxGeometry args={[0.76, 0.76, 0.022]} />
                <meshStandardMaterial color={FACE_COLORS[2]} roughness={0.12} metalness={0.02} />
              </mesh>
            )}
            {y === -1 && (
              <mesh position={[0, -0.46, 0]}>
                <boxGeometry args={[0.76, 0.022, 0.76]} />
                <meshStandardMaterial color={FACE_COLORS[3]} roughness={0.12} metalness={0.02} />
              </mesh>
            )}
            {x === -1 && (
              <mesh position={[-0.46, 0, 0]}>
                <boxGeometry args={[0.022, 0.76, 0.76]} />
                <meshStandardMaterial color={FACE_COLORS[4]} roughness={0.12} metalness={0.02} />
              </mesh>
            )}
            {z === -1 && (
              <mesh position={[0, 0, -0.46]}>
                <boxGeometry args={[0.76, 0.76, 0.022]} />
                <meshStandardMaterial color={FACE_COLORS[5]} roughness={0.12} metalness={0.02} />
              </mesh>
            )}
          </group>
        ))}
      </group>
    </group>
  );
}

// ── Animated floating particle dot ──
function Particle({ style }) {
  return (
    <div
      style={{
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(1px)',
        pointerEvents: 'none',
        animation: `particleFloat ${6 + Math.random() * 4}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 3}s`,
        ...style,
      }}
    />
  );
}

export default function SplashScreen({ onFinish }) {
  // Stages: 0=dark, 1=particles+cube forming, 2=text reveal, 3=glow, 4=fade out
  const [stage, setStage] = useState(0);
  const [cubeVisible, setCubeVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [glowVisible, setGlowVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => { setCubeVisible(true); setStage(1); }, 300);
    const t2 = setTimeout(() => { setTextVisible(true); setStage(2); }, 1200);
    const t3 = setTimeout(() => { setGlowVisible(true); setStage(3); }, 1700);
    const t4 = setTimeout(() => { setFadingOut(true); setStage(4); }, 2600);
    const t5 = setTimeout(() => { if (onFinish) onFinish(); }, 3100);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5);
    };
  }, [onFinish]);

  const PARTICLES = [
    { color: '#FF3B30', size: 5, top: '20%', left: '12%' },
    { color: '#FF9500', size: 4, top: '65%', left: '8%' },
    { color: '#FFD60A', size: 6, top: '30%', left: '88%' },
    { color: '#30D158', size: 5, top: '72%', left: '85%' },
    { color: '#0A84FF', size: 4, top: '15%', left: '75%' },
    { color: '#BF5AF2', size: 5, top: '80%', left: '30%' },
    { color: '#FF3B30', size: 3, top: '50%', left: '5%' },
    { color: '#30D158', size: 3, top: '45%', left: '92%' },
    { color: '#FFD60A', size: 4, top: '88%', left: '60%' },
    { color: '#0A84FF', size: 3, top: '10%', left: '45%' },
  ];

  return (
    <div
      className="splash-container"
      style={{
        opacity: fadingOut ? 0 : 1,
        visibility: fadingOut ? 'hidden' : 'visible',
        transition: 'opacity 0.55s ease, visibility 0.55s ease',
        background: '#0B1020',
        overflow: 'hidden',
      }}
    >
      {/* Animated color blobs */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10, 132, 255, 0.18) 0%, transparent 70%)',
        filter: 'blur(50px)',
        top: '10%',
        left: '20%',
        pointerEvents: 'none',
        opacity: stage >= 1 ? 1 : 0,
        transition: 'opacity 0.8s ease',
        animation: 'orbDrift 10s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(191, 90, 242, 0.14) 0%, transparent 70%)',
        filter: 'blur(40px)',
        bottom: '10%',
        right: '20%',
        pointerEvents: 'none',
        opacity: stage >= 1 ? 1 : 0,
        transition: 'opacity 0.8s ease 0.2s',
        animation: 'orbDrift2 13s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 59, 48, 0.1) 0%, transparent 70%)',
        filter: 'blur(30px)',
        top: '60%',
        left: '10%',
        pointerEvents: 'none',
        opacity: stage >= 2 ? 1 : 0,
        transition: 'opacity 0.8s ease 0.3s',
      }} />

      {/* Floating color particles */}
      {stage >= 1 && PARTICLES.map((p, i) => (
        <Particle
          key={i}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            top: p.top,
            left: p.left,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Cube glow ring behind the cube */}
      {glowVisible && (
        <div style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(10, 132, 255, 0.2) 0%, rgba(191, 90, 242, 0.1) 50%, transparent 70%)',
          filter: 'blur(20px)',
          zIndex: 1,
          opacity: glowVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
          animation: 'pulseGlow 2s ease-in-out infinite',
        }} />
      )}

      {/* 3D Cube */}
      <div style={{
        width: '250px',
        height: '250px',
        position: 'relative',
        zIndex: 2,
        opacity: cubeVisible ? 1 : 0,
        transform: cubeVisible ? 'scale(1)' : 'scale(0.3)',
        transition: 'opacity 0.6s var(--ease-spring), transform 0.7s var(--ease-spring)',
      }}>
        <Canvas camera={{ position: [4.5, 4.2, 4.5], fov: 42 }} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[6, 10, 6]} intensity={1.6} />
          <directionalLight position={[-6, -6, -6]} intensity={0.7} />
          <pointLight position={[0, 0, 5]} intensity={1.0} color="#5AC8FA" />
          <pointLight position={[5, 0, 0]} intensity={0.8} color="#BF5AF2" />
          <pointLight position={[0, -5, 0]} intensity={0.6} color="#FF9500" />
          <SplashCube spin={stage === 1} scaleIn={stage <= 1} />
        </Canvas>
      </div>

      {/* Brand text reveal */}
      <div style={{
        zIndex: 3,
        textAlign: 'center',
        marginTop: '24px',
        opacity: textVisible ? 1 : 0,
        transform: textVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: '900',
          letterSpacing: '-0.04em',
          marginBottom: '8px',
          color: '#F8FAFF',
        }}>
          Cube<span className="text-gradient">Solve</span>
        </h1>

        {/* Colorful dots representing cube colors */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '12px',
          opacity: stage >= 3 ? 1 : 0,
          transform: stage >= 3 ? 'scale(1)' : 'scale(0.5)',
          transition: 'all 0.4s var(--ease-spring)',
        }}>
          {['#FF3B30', '#FF9500', '#FFD60A', '#30D158', '#0A84FF', '#BF5AF2'].map((color, i) => (
            <div key={i} style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 8px ${color}`,
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>

        <p style={{
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.45)',
          fontWeight: '500',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Intelligent Rubik's Suite
        </p>
      </div>

      {/* Skip button */}
      <button
        onClick={onFinish}
        style={{
          position: 'absolute',
          bottom: '32px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '0.78rem',
          cursor: 'pointer',
          padding: '8px 20px',
          borderRadius: '100px',
          zIndex: 10,
          fontFamily: 'var(--font-main)',
          fontWeight: '600',
          letterSpacing: '0.04em',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      >
        Skip ➔
      </button>
    </div>
  );
}
