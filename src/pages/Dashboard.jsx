import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { historyApi } from '../api/cubeApi';
import CubeVisualizer from '../components/CubeVisualizer';
import {
  Puzzle, Dumbbell, Trophy, Clock, Zap, ArrowRight,
  TrendingUp, History as HistoryIcon, Loader2,
  ChevronRight, User, BarChart2, Layers,
} from 'lucide-react';

function useAnimatedNumber(target, duration = 700) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (target == null || isNaN(target)) { setCurrent(0); return; }
    const num = Number(target);
    if (num === 0) { setCurrent(0); return; }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setCurrent(num); return; }
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCurrent(Math.round(num * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target, duration]);
  return current;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [solves, setSolves] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let isMounted = true;
    async function loadData() {
      setLoading(true); setError(null);
      try {
        const solvesRes = await historyApi.getMy();
        const list = Array.isArray(solvesRes.data) ? solvesRes.data : [];
        if (isMounted) setSolves(list);
        try {
          const statsRes = await historyApi.getMyStats();
          if (isMounted) setStats(statsRes.data);
        } catch {
          const total = list.length;
          if (isMounted) setStats({
            totalSolves: total,
            bestTimeMs: total ? Math.min(...list.map(s => s.solveTimeMs)) : null,
            averageTimeMs: total ? Math.round(list.reduce((a, s) => a + s.solveTimeMs, 0) / total) : null,
            bestMoveCount: total ? Math.min(...list.map(s => s.moveCount)) : null,
            averageMoves: total ? Math.round(list.reduce((a, s) => a + s.moveCount, 0) / total) : null,
          });
        }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Failed to load data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [user]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const fmt = (ms) => {
    if (ms == null || isNaN(ms)) return '—';
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(2)}s`;
    return `${Math.floor(s / 60)}m ${(s % 60).toFixed(2).padStart(5, '0')}s`;
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  };

  const totalSolves = stats?.totalSolves ?? solves.length;
  const bestTime    = stats?.bestTimeMs != null ? fmt(stats.bestTimeMs) : '—';
  const avgTime     = stats?.averageTimeMs != null ? fmt(stats.averageTimeMs) : '—';
  const rawAvgMoves = stats?.averageMoves ?? (solves.length ? Math.round(solves.reduce((a, s) => a + s.moveCount, 0) / solves.length) : null);
  const recentSolves = solves.slice(0, 4);

  const animTotal    = useAnimatedNumber(totalSolves);
  const animAvgMoves = useAnimatedNumber(rawAvgMoves);

  if (loading) {
    return (
      <div className="page-container flex-center" style={{ minHeight: '75vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: '#0A84FF', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Loading CubeSolve</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Connecting to your solve history…</p>
        </div>
      </div>
    );
  }

  const ACTION_CARDS = [
    {
      label: 'Solve Cube',
      desc: 'Step-by-step 3D solver with Kociemba engine',
      to: '/solver',
      Icon: Puzzle,
      color: '#0A84FF',
      glow: 'rgba(10,132,255,0.15)',
      border: 'rgba(10,132,255,0.25)',
      cls: 'card-solve',
    },
    {
      label: 'Practice Timer',
      desc: 'Speedcubing timer, scrambles & solve detection',
      to: '/practice',
      Icon: Dumbbell,
      color: '#30D158',
      glow: 'rgba(48,209,88,0.15)',
      border: 'rgba(48,209,88,0.25)',
      cls: 'card-practice',
    },
    {
      label: 'Solve History',
      desc: 'Browse recorded times & replay solutions in 3D',
      to: '/history',
      Icon: HistoryIcon,
      color: '#BF5AF2',
      glow: 'rgba(191,90,242,0.15)',
      border: 'rgba(191,90,242,0.25)',
      cls: 'card-history',
    },
    {
      label: 'Statistics',
      desc: 'Personal records, move breakdown & charts',
      to: '/stats',
      Icon: BarChart2,
      color: '#FF9500',
      glow: 'rgba(255,149,0,0.15)',
      border: 'rgba(255,149,0,0.25)',
      cls: 'card-stats',
    },
  ];

  const STAT_CARDS = [
    { label: 'Total Solves',  value: animTotal, color: '#0A84FF', Icon: Trophy,     glow: 'rgba(10,132,255,0.2)' },
    { label: 'Best Time',     value: bestTime,  color: '#30D158', Icon: Clock,      glow: 'rgba(48,209,88,0.2)' },
    { label: 'Avg Time',      value: avgTime,   color: '#FF9500', Icon: TrendingUp, glow: 'rgba(255,149,0,0.2)' },
    { label: 'Avg Moves',     value: rawAvgMoves != null ? animAvgMoves : '—', color: '#BF5AF2', Icon: Layers, glow: 'rgba(191,90,242,0.2)' },
  ];

  return (
    <div className="page-container" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Background ambient glows */}
      <div className="orb-animate-1" style={{
        position: 'absolute', top: '2%', left: '5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,132,255,0.08) 0%, transparent 70%)',
        filter: 'blur(55px)', pointerEvents: 'none',
      }} />
      <div className="orb-animate-2" style={{
        position: 'absolute', top: '35%', right: '2%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(191,90,242,0.07) 0%, transparent 70%)',
        filter: 'blur(45px)', pointerEvents: 'none',
      }} />

      <div className="container" style={{ paddingTop: '24px' }}>

        {error && (
          <div style={{
            marginBottom: '16px', padding: '12px 16px', borderRadius: '12px',
            background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)',
            color: '#ff8080', fontSize: '0.87rem', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', fontWeight: '700' }}>×</button>
          </div>
        )}

        {/* ── Header: Greeting + Profile ── */}
        <div className="animate-fade-in" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '28px', gap: '12px',
        }}>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '3px' }}>{greeting},</p>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              fontWeight: '900',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}>
              {user?.username || 'Cuber'} 👋
            </h1>
          </div>
          <button
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px 6px 6px',
              borderRadius: '100px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
            }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(10,132,255,0.35)',
            }}>
              <User size={17} color="#ffffff" />
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: '600' }}>Profile</span>
          </button>
        </div>

        {/* ── Hero Section: 3D Cube Centerpiece ── */}
        <div className="animate-fade-in" style={{
          borderRadius: '28px',
          background: 'rgba(17,24,39,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          padding: '28px 24px',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}>
          {/* Color stripe at top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, #FF3B30, #FF9500, #FFD60A, #30D158, #0A84FF, #BF5AF2)',
            borderRadius: '28px 28px 0 0',
          }} />

          {/* Floating particles */}
          <div className="hero-particle-1" style={{ position: 'absolute', top: '20%', right: '25%', width: '8px', height: '8px', borderRadius: '50%', background: '#5AC8FA', boxShadow: '0 0 14px #5AC8FA', pointerEvents: 'none', zIndex: 2 }} />
          <div className="hero-particle-2" style={{ position: 'absolute', bottom: '25%', right: '38%', width: '6px', height: '6px', borderRadius: '50%', background: '#BF5AF2', boxShadow: '0 0 10px #BF5AF2', pointerEvents: 'none', zIndex: 2 }} />

          <div className="dashboard-hero-grid">
            {/* Left: CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', borderRadius: '100px',
                background: 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.25)',
                fontSize: '0.76rem', color: '#5AC8FA', width: 'fit-content',
              }}>
                <Zap size={12} color="#FFD60A" />
                <span>Kociemba Two-Phase Java Engine</span>
              </div>

              <div>
                <h2 style={{
                  fontSize: 'clamp(1.7rem, 5vw, 2.6rem)',
                  fontWeight: '900',
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  marginBottom: '10px',
                }}>
                  Ready to <span className="text-gradient-solve">Solve</span>?
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '440px' }}>
                  Experience Kociemba solving in milliseconds with physical 3D layer visualization,
                  or sharpen your speed with the precision timer.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                <button
                  onClick={() => navigate('/solver')}
                  style={{
                    flex: '1 1 160px',
                    padding: '14px 22px',
                    fontSize: '0.98rem',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #0A84FF 0%, #0066cc 100%)',
                    border: 'none',
                    color: '#fff',
                    fontFamily: 'var(--font-main)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 24px rgba(10,132,255,0.5)',
                    transition: 'all 0.2s ease',
                    minHeight: '50px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(10,132,255,0.65)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(10,132,255,0.5)'; }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                >
                  <Puzzle size={19} />
                  <span>Solve Cube</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={() => navigate('/practice')}
                  style={{
                    flex: '1 1 150px',
                    padding: '14px 20px',
                    fontSize: '0.98rem',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #30D158 0%, #25a244 100%)',
                    border: 'none',
                    color: '#fff',
                    fontFamily: 'var(--font-main)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 20px rgba(48,209,88,0.4)',
                    transition: 'all 0.2s ease',
                    minHeight: '50px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Dumbbell size={19} />
                  <span>Practice</span>
                </button>
              </div>
            </div>

            {/* Right: 3D Cube */}
            <div style={{
              width: '100%',
              height: 'clamp(220px, 32vw, 290px)',
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'radial-gradient(circle at 50% 55%, rgba(10,132,255,0.05), rgba(11,16,32,0.5))',
            }}>
              {/* Glow ring beneath cube */}
              <div style={{
                position: 'absolute', bottom: 0, left: '15%', right: '15%', height: '60px',
                background: 'radial-gradient(ellipse at 50% 50%, rgba(10,132,255,0.25) 0%, rgba(191,90,242,0.1) 50%, transparent 80%)',
                filter: 'blur(18px)', pointerEvents: 'none', zIndex: 0,
              }} />
              <CubeVisualizer height="100%" autoRotate={true} enableOrbit={true} enableZoom={false} />
              <div style={{ position: 'absolute', bottom: '8px', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                <span style={{
                  fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)',
                  background: 'rgba(0,0,0,0.55)', padding: '3px 10px', borderRadius: '100px',
                  backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  Drag to rotate in 3D
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Action Cards ── */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.01em' }}>Quick Actions</h2>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Tap to open</span>
          </div>

          <div className="dashboard-actions-grid">
            {ACTION_CARDS.map(({ label, desc, to, Icon, color, glow, border, cls }) => (
              <div
                key={to}
                onClick={() => navigate(to)}
                className={`quick-action-card ${cls}`}
                style={{
                  borderColor: border,
                  background: `linear-gradient(145deg, ${glow}, rgba(26,34,53,0.6))`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: `${color}1a`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color, boxShadow: `0 0 16px ${color}30`,
                    border: `1px solid ${color}25`,
                  }}>
                    <Icon size={20} />
                  </div>
                  <ArrowRight size={16} color="var(--text-muted)" className="action-card-arrow" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.97rem', fontWeight: '700', marginBottom: '5px', color: '#F8FAFF' }}>{label}</h3>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Performance Overview ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#FF9500" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Performance Overview</h2>
            </div>
            <button onClick={() => navigate('/stats')} style={{
              background: 'none', border: 'none', color: '#FF9500',
              fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              Full Stats <ChevronRight size={14} />
            </button>
          </div>

          <div className="dashboard-stats-grid">
            {STAT_CARDS.map(({ label, value, color, Icon, glow }) => (
              <div key={label} className="stat-card" style={{ borderColor: `${color}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '9px',
                    background: `${color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${color}25`,
                  }}>
                    <Icon size={15} color={color} />
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{label}</span>
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: '900', letterSpacing: '-0.025em', color, lineHeight: 1 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent Solves ── */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HistoryIcon size={18} color="#BF5AF2" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Recent Solves</h2>
            </div>
            <button onClick={() => navigate('/history')} style={{
              background: 'none', border: 'none', color: '#BF5AF2',
              fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              View All <ChevronRight size={14} />
            </button>
          </div>

          {recentSolves.length === 0 ? (
            <div style={{
              padding: '40px 24px', textAlign: 'center',
              background: 'rgba(17,24,39,0.5)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '20px',
            }}>
              <HistoryIcon size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                No solves yet. Complete a puzzle to see your history!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentSolves.map((solve, i) => (
                <div key={solve.id} style={{
                  padding: '14px 18px',
                  background: 'rgba(26,34,53,0.6)',
                  border: '1px solid rgba(191,90,242,0.15)',
                  borderRadius: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  animation: `slideInUp 0.35s var(--ease-smooth) ${i * 0.07}s both`,
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: i === 0 && stats?.bestTimeMs === solve.solveTimeMs
                        ? 'rgba(255,214,10,0.15)' : 'rgba(191,90,242,0.12)',
                      border: i === 0 && stats?.bestTimeMs === solve.solveTimeMs
                        ? '1px solid rgba(255,214,10,0.3)' : '1px solid rgba(191,90,242,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i === 0 && stats?.bestTimeMs === solve.solveTimeMs
                        ? <Trophy size={16} color="#FFD60A" />
                        : <Clock size={16} color="#BF5AF2" />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#BF5AF2', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                        {fmt(solve.solveTimeMs)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fmtDate(solve.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>{solve.moveCount} moves</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{solve.id}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
