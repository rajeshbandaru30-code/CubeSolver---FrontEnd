import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CubeVisualizer from '../components/CubeVisualizer';
import { Box, Zap, Shield, Clock, ChevronRight, CheckCircle, Sparkles, Trophy } from 'lucide-react';

const FEATURES = [
  { Icon: Zap,        title: 'Instant Solving',    desc: 'Java Kociemba two-phase engine computes optimal solutions in under a second.' },
  { Icon: Shield,     title: 'Physics Validation', desc: 'Validates 54 facelets, center configurations, edge/corner parity, and impossible twists.' },
  { Icon: Clock,      title: 'Practice Arena',     desc: 'Speedcubing timer with automatic solve detection, TPS metrics, and database history.' },
];

const STEPS = [
  'Input your scrambled cube state using the 3D visualizer or 2D paint net',
  'Java backend validates physical permutation and parity constraints',
  'Two-phase Kociemba algorithm computes an optimal solution sequence',
  'Follow the step-by-step 3D player with beginner-friendly face instructions',
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Hero Section */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px 16px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient background glows */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />

        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1, maxWidth: '820px', width: '100%' }}>

          {/* Engine Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '100px',
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              marginBottom: '20px',
              fontSize: '0.82rem',
              color: '#a5b4fc',
            }}
          >
            <Zap size={14} color="#38bdf8" />
            <span>Java Kociemba Engine · Spring Boot · React 3D</span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 7vw, 4rem)',
              fontWeight: '800',
              lineHeight: '1.15',
              marginBottom: '16px',
              letterSpacing: '-0.03em',
            }}
          >
            Solve Any <span className="text-gradient">Rubik's Cube</span> In Seconds
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              color: 'var(--text-secondary)',
              maxWidth: '560px',
              margin: '0 auto 24px',
              lineHeight: '1.6',
            }}
          >
            The intelligent cube solving suite with authentic 3D layer visualization,
            physical validation, and precision speedcubing timer.
          </p>

          {/* Hero 3D Cube Visualizer Centerpiece */}
          <div
            style={{
              width: '100%',
              maxWidth: '340px',
              height: '240px',
              margin: '0 auto 28px',
              position: 'relative',
            }}
          >
            <CubeVisualizer height={240} autoRotate={true} enableOrbit={true} enableZoom={false} />
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              style={{ padding: '14px 32px', fontSize: '1.02rem', borderRadius: '14px' }}
              onClick={() => navigate(user ? '/solver' : '/auth')}
            >
              <span>{user ? 'Open 3D Solver' : 'Get Started Free'}</span>
              <ChevronRight size={18} />
            </button>

            {!user ? (
              <button
                className="btn-secondary"
                style={{ padding: '14px 28px', fontSize: '1.02rem', borderRadius: '14px' }}
                onClick={() => navigate('/auth?mode=login')}
              >
                Sign In
              </button>
            ) : (
              <button
                className="btn-secondary"
                style={{ padding: '14px 28px', fontSize: '1.02rem', borderRadius: '14px' }}
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '60px 16px', background: 'rgba(0,0,0,0.25)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '36px' }}>
            Engineered for <span className="text-gradient">Speed & Accuracy</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="glass-panel" style={{ padding: '28px 24px', textAlign: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'rgba(99,102,241,0.15)',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={26} color="var(--primary-light)" />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '60px 16px' }}>
        <div className="container" style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '36px' }}>
            How It Works
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="glass-card"
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}
              >
                <div
                  style={{
                    minWidth: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    color: '#ffffff',
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <button
              className="btn-primary"
              style={{ padding: '14px 32px' }}
              onClick={() => navigate(user ? '/solver' : '/auth')}
            >
              <CheckCircle size={18} />
              <span>{user ? 'Solve Now' : 'Create Free Account'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '24px 16px',
          borderTop: '1px solid var(--surface-border)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.82rem',
          marginTop: 'auto',
        }}
      >
        CubeSolve · Java Kociemba Engine · Spring Boot + React 3D
      </footer>
    </div>
  );
}
