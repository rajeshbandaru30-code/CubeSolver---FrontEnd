import React, { useEffect, useState, useMemo } from 'react';
import { historyApi } from '../api/cubeApi';
import {
  BarChart2, Loader2, Trophy, TrendingUp, Clock, Hash,
  Zap, Target, Activity, AlertCircle,
} from 'lucide-react';

const BUCKET_COLORS = ['#FF3B30', '#FF9500', '#FFD60A', '#30D158', '#0A84FF'];

export default function Statistics() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    historyApi.getMy()
      .then(res => setHistory(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load statistics. Ensure you are signed in.'))
      .finally(() => setLoading(false));
  }, []);

  const n = history.length;
  const moveCounts = useMemo(() => history.map(h => h.moveCount), [history]);
  const times = useMemo(() => history.map(h => h.solveTimeMs), [history]);

  const stat = arr => arr.length === 0 ? null : {
    min: Math.min(...arr),
    max: Math.max(...arr),
    avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
    median: (() => {
      const s = [...arr].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
    })(),
  };

  const moveStats = useMemo(() => stat(moveCounts), [moveCounts]);
  const timeStats = useMemo(() => stat(times), [times]);

  const fmt = ms => {
    if (ms == null || isNaN(ms)) return '—';
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(2)}s`;
    return `${Math.floor(s / 60)}m ${(s % 60).toFixed(2).padStart(5, '0')}s`;
  };

  const buckets = useMemo(() => [
    { label: '≤10',  count: moveCounts.filter(m => m <= 10).length },
    { label: '11–15', count: moveCounts.filter(m => m >= 11 && m <= 15).length },
    { label: '16–20', count: moveCounts.filter(m => m >= 16 && m <= 20).length },
    { label: '21–25', count: moveCounts.filter(m => m >= 21 && m <= 25).length },
    { label: '>25',   count: moveCounts.filter(m => m > 25).length },
  ], [moveCounts]);

  const maxBucket = useMemo(() => Math.max(...buckets.map(b => b.count), 1), [buckets]);

  // Recent solves trend (last 10 times)
  const recentTimes = useMemo(() => {
    const sorted = [...history].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return sorted.slice(-10).map(s => s.solveTimeMs);
  }, [history]);
  const maxTime = useMemo(() => Math.max(...recentTimes, 1), [recentTimes]);

  if (loading) {
    return (
      <div className="page-container flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#FF9500', margin: '0 auto 14px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Analyzing your solve metrics…</p>
        </div>
      </div>
    );
  }

  const KPI_CARDS = [
    { label: 'Total Solves',  value: n,              color: '#0A84FF', Icon: Trophy,     glow: 'rgba(10,132,255,0.2)' },
    { label: 'Best Time',     value: fmt(timeStats?.min), color: '#30D158', Icon: Clock,  glow: 'rgba(48,209,88,0.2)' },
    { label: 'Average Time',  value: fmt(timeStats?.avg), color: '#FF9500', Icon: TrendingUp, glow: 'rgba(255,149,0,0.2)' },
    { label: 'Median Time',   value: fmt(timeStats?.median), color: '#BF5AF2', Icon: Activity, glow: 'rgba(191,90,242,0.2)' },
    { label: 'Best Moves',    value: moveStats?.min ?? '—', color: '#FFD60A', Icon: Hash, glow: 'rgba(255,214,10,0.2)' },
    { label: 'Average Moves', value: moveStats?.avg ?? '—', color: '#FF3B30', Icon: Target, glow: 'rgba(255,59,48,0.2)' },
  ];

  return (
    <div className="page-container page-bg-stats" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Orange ambient glow */}
      <div className="orb-animate-2" style={{
        position: 'absolute', top: '3%', left: '5%',
        width: '450px', height: '450px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,149,0,0.09) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />
      <div className="orb-animate-1" style={{
        position: 'absolute', bottom: '5%', right: '5%',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,214,10,0.07) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div className="container" style={{ paddingTop: '24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'rgba(255,149,0,0.15)', border: '1px solid rgba(255,149,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(255,149,0,0.25)',
            }}>
              <BarChart2 size={20} color="#FF9500" />
            </div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', letterSpacing: '-0.025em' }}>
              Performance <span className="text-gradient-stats">Analytics</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            Comprehensive metrics from {n} verified solve{n !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div className="animate-fade-in" style={{
            background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)',
            borderRadius: '12px', padding: '12px 16px', marginBottom: '16px',
            display: 'flex', gap: '10px', alignItems: 'center', color: '#ff8080', fontSize: '0.87rem',
          }}>
            <AlertCircle size={17} color="#FF3B30" />
            <span>{error}</span>
          </div>
        )}

        {n === 0 ? (
          <div style={{
            padding: '70px 24px', textAlign: 'center',
            background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px',
          }}>
            <BarChart2 size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Statistics Yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '360px', margin: '0 auto' }}>
              Complete a few solves in Practice Mode or the 3D Solver to populate your analytics!
            </p>
          </div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '28px',
            }}>
              {KPI_CARDS.map(({ label, value, color, Icon, glow }) => (
                <div key={label} style={{
                  padding: '18px 16px',
                  background: 'rgba(26,34,53,0.65)',
                  border: `1px solid ${color}20`,
                  borderRadius: '18px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  animation: 'slideInUp 0.4s var(--ease-smooth) both',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `${color}35`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `${color}20`; }}
                >
                  {/* Glow icon in corner */}
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '70px', height: '70px', borderRadius: '50%',
                    background: glow, filter: 'blur(20px)', opacity: 0.5,
                    transform: 'translate(20px, -20px)', pointerEvents: 'none',
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${color}25`,
                    }}>
                      <Icon size={15} color={color} />
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: '1.55rem', fontWeight: '900', color, letterSpacing: '-0.025em', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Move Distribution Bar Chart ── */}
            <div style={{
              padding: '24px', marginBottom: '24px',
              background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,149,0,0.15)',
              borderRadius: '24px', backdropFilter: 'blur(16px)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255,149,0,0.7), transparent)',
                borderRadius: '24px 24px 0 0',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} color="#FF9500" />
                  <h2 style={{ fontSize: '1.02rem', fontWeight: '800' }}>Move Count Distribution</h2>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: '100px' }}>
                  {n} solves
                </span>
              </div>

              <div style={{
                display: 'flex', gap: '10px', alignItems: 'flex-end', height: '180px', paddingTop: '10px',
              }}>
                {buckets.map(({ label, count }, idx) => {
                  const pct = (count / maxBucket) * 100;
                  const color = BUCKET_COLORS[idx];
                  return (
                    <div key={label} style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end',
                    }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', color, fontFamily: 'var(--font-mono)' }}>
                        {count}
                      </span>
                      <div style={{
                        width: '100%',
                        height: `${Math.max(pct, 3)}%`,
                        background: `linear-gradient(180deg, ${color}, ${color}60)`,
                        borderRadius: '8px 8px 0 0',
                        boxShadow: `0 0 16px ${color}40`,
                        transition: 'height 0.6s var(--ease-spring)',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                          background: 'rgba(255,255,255,0.15)', borderRadius: '8px 8px 0 0',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Recent Trend ── */}
            {recentTimes.length >= 2 && (
              <div style={{
                padding: '24px', marginBottom: '24px',
                background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,149,0,0.15)',
                borderRadius: '24px', backdropFilter: 'blur(16px)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: 'linear-gradient(90deg, transparent, rgba(48,209,88,0.7), transparent)',
                  borderRadius: '24px 24px 0 0',
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} color="#30D158" />
                    <h2 style={{ fontSize: '1.02rem', fontWeight: '800' }}>Recent Solve Trend</h2>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Last {recentTimes.length} solves
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '120px' }}>
                  {recentTimes.map((t, i) => {
                    const pct = (t / maxTime) * 100;
                    const isLow = t === Math.min(...recentTimes);
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
                        <div style={{
                          width: '100%', height: `${Math.max(pct, 4)}%`,
                          background: isLow
                            ? 'linear-gradient(180deg, #30D158, #30D15860)'
                            : 'linear-gradient(180deg, rgba(255,149,0,0.8), rgba(255,149,0,0.3))',
                          borderRadius: '4px 4px 0 0',
                          boxShadow: isLow ? '0 0 12px rgba(48,209,88,0.4)' : 'none',
                          transition: 'height 0.5s var(--ease-spring)',
                        }} />
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {i + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Oldest</span>
                  <span>Most Recent</span>
                </div>
              </div>
            )}

            {/* ── Breakdown Tables ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}>
              {/* Time Breakdown */}
              <div style={{
                padding: '22px',
                background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,149,0,0.15)',
                borderRadius: '20px', backdropFilter: 'blur(16px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Clock size={16} color="#30D158" />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                    Solve Time Breakdown
                  </h3>
                </div>
                {[
                  ['Best (Fastest)', fmt(timeStats?.min), '#30D158'],
                  ['Average Time',   fmt(timeStats?.avg), '#FF9500'],
                  ['Median Time',    fmt(timeStats?.median), 'var(--text-primary)'],
                  ['Slowest Solve',  fmt(timeStats?.max), '#FF3B30'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.87rem',
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <strong style={{ color, fontFamily: 'var(--font-mono)', fontSize: '0.92rem' }}>{val}</strong>
                  </div>
                ))}
              </div>

              {/* Move Count Breakdown */}
              <div style={{
                padding: '22px',
                background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,149,0,0.15)',
                borderRadius: '20px', backdropFilter: 'blur(16px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Hash size={16} color="#FF9500" />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                    Move Count Breakdown
                  </h3>
                </div>
                {[
                  ['Fewest Moves',  moveStats?.min ?? '—', '#30D158'],
                  ['Average Moves', moveStats?.avg ?? '—', '#FF9500'],
                  ['Median Moves',  moveStats?.median ?? '—', 'var(--text-primary)'],
                  ['Most Moves',    moveStats?.max ?? '—', '#FF3B30'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.87rem',
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <strong style={{ color, fontFamily: 'var(--font-mono)', fontSize: '0.92rem' }}>{val}</strong>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
