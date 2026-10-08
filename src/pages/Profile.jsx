import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { historyApi } from '../api/cubeApi';
import {
  User, Mail, Trophy, Clock, Zap, LogOut,
  Shield, ChevronRight, CheckCircle2, History, BarChart2,
  TrendingUp, Layers,
} from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [haptics, setHaptics] = useState(() => localStorage.getItem('cs_haptics') !== 'false');

  useEffect(() => {
    if (!user) return;
    historyApi.getMyStats()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [user]);

  const toggleHaptics = () => {
    const next = !haptics;
    setHaptics(next);
    localStorage.setItem('cs_haptics', String(next));
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const fmt = ms => {
    if (ms == null || isNaN(ms)) return '—';
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(2)}s`;
    return `${Math.floor(s / 60)}m ${(s % 60).toFixed(2).padStart(5, '0')}s`;
  };

  const STAT_ROWS = [
    { label: 'Total Solves', value: stats?.totalSolves ?? '0', color: '#0A84FF', Icon: Trophy },
    { label: 'Best Time',    value: fmt(stats?.bestTimeMs),    color: '#30D158', Icon: Clock },
    { label: 'Avg Time',     value: fmt(stats?.averageTimeMs), color: '#FF9500', Icon: TrendingUp },
    { label: 'Avg Moves',    value: stats?.averageMoves != null ? Math.round(stats.averageMoves) : '—', color: '#BF5AF2', Icon: Layers },
  ];

  const QUICK_LINKS = [
    { label: 'My Solve History', desc: 'Browse & replay past solves in 3D', to: '/history', color: '#BF5AF2', Icon: History },
    { label: 'Advanced Analytics', desc: 'Charts, records & performance trends', to: '/stats', color: '#FF9500', Icon: BarChart2 },
    { label: 'Solve Cube', desc: 'Open the 3D solver', to: '/solver', color: '#0A84FF', Icon: Layers },
  ];

  // Initial letter for avatar
  const initial = (user?.username || 'C').charAt(0).toUpperCase();

  return (
    <div className="page-container" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Purple ambient */}
      <div className="orb-animate-1" style={{
        position: 'absolute', top: '3%', right: '8%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,132,255,0.09) 0%, transparent 70%)',
        filter: 'blur(45px)', pointerEvents: 'none',
      }} />

      <div className="container" style={{ paddingTop: '24px', maxWidth: '660px' }}>

        {/* ── Profile Header Card ── */}
        <div style={{
          padding: '28px 24px', marginBottom: '24px',
          background: 'rgba(17,24,39,0.75)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '28px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          position: 'relative', overflow: 'hidden',
          animation: 'slideInUp 0.4s var(--ease-smooth) both',
        }}>
          {/* Cube-colors stripe */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, #FF3B30, #FF9500, #FFD60A, #30D158, #0A84FF, #BF5AF2)',
            borderRadius: '28px 28px 0 0',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '76px', height: '76px', borderRadius: '22px', flexShrink: 0,
              background: 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(10,132,255,0.4), 0 0 0 3px rgba(10,132,255,0.15)',
              fontSize: '2.2rem', fontWeight: '900', color: '#fff',
            }}>
              {initial}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.03em' }}>
                  {user?.username || 'Cuber'}
                </h1>
                <span style={{
                  fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '100px',
                  background: 'rgba(48,209,88,0.15)', border: '1px solid rgba(48,209,88,0.3)',
                  color: '#30D158',
                }}>
                  ✓ Active Cuber
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                <Mail size={14} />
                <span style={{ wordBreak: 'break-all' }}>{user?.email || 'Authenticated User'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Your Performance
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {STAT_ROWS.map(({ label, value, color, Icon }) => (
              <div key={label} style={{
                padding: '16px 18px',
                background: 'rgba(26,34,53,0.6)', border: `1px solid ${color}20`,
                borderRadius: '18px', position: 'relative', overflow: 'hidden',
                animation: 'slideInUp 0.4s var(--ease-smooth) both',
              }}>
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: `${color}12`, transform: 'translate(15px, -15px)',
                  pointerEvents: 'none',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${color}25`,
                  }}>
                    <Icon size={14} color={color} />
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{label}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color, letterSpacing: '-0.025em', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
                  {loadingStats ? '…' : value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Activity & Features
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {QUICK_LINKS.map(({ label, desc, to, color, Icon }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px',
                  background: 'rgba(26,34,53,0.6)', border: `1px solid ${color}18`,
                  borderRadius: '18px', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.18s ease',
                  animation: 'slideInUp 0.4s var(--ease-smooth) both',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}18`; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${color}25`, boxShadow: `0 0 12px ${color}25`, flexShrink: 0,
                  }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#F8FAFF', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Preferences ── */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Preferences
          </h2>
          <div style={{
            padding: '18px 20px',
            background: 'rgba(26,34,53,0.6)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px',
          }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.92rem', marginBottom: '3px', color: '#F8FAFF' }}>
                Touch & Audio Feedback
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Sound and haptic cues during cube moves
              </p>
            </div>
            <button
              type="button"
              onClick={toggleHaptics}
              aria-label="Toggle haptic feedback"
              style={{
                width: '52px', height: '28px', borderRadius: '100px',
                background: haptics ? 'linear-gradient(135deg, #30D158, #25a244)' : 'rgba(255,255,255,0.12)',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background 0.25s ease',
                boxShadow: haptics ? '0 4px 12px rgba(48,209,88,0.35)' : 'none',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff',
                position: 'absolute', top: '3px',
                left: haptics ? '27px' : '3px',
                transition: 'left 0.25s var(--ease-spring)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </div>

        {/* ── Engine Info ── */}
        <div style={{
          padding: '16px 20px', marginBottom: '28px',
          background: 'rgba(10,132,255,0.06)', border: '1px solid rgba(10,132,255,0.15)',
          borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <Shield size={20} color="#5AC8FA" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Powered by <strong style={{ color: '#5AC8FA' }}>Java Kociemba Two-Phase Engine</strong> &{' '}
            <strong style={{ color: '#5AC8FA' }}>Spring Boot</strong>.
            All solves are synchronized to your private MySQL account.
          </div>
        </div>

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '14px 20px',
            background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)',
            borderRadius: '16px', cursor: 'pointer', fontFamily: 'inherit',
            fontWeight: '700', fontSize: '0.95rem', color: '#ff8080',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.18s ease', marginBottom: '32px', minHeight: '50px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,59,48,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,59,48,0.25)'; }}
        >
          <LogOut size={17} /> Sign Out of Account
        </button>

      </div>
    </div>
  );
}
