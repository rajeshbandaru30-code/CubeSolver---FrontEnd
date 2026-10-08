import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyApi } from '../api/cubeApi';
import { useAuth } from '../context/AuthContext';
import CubePlayer from '../components/CubePlayer';
import { getScrambledState } from '../engine/cubeMoves';
import {
  History as HistoryIcon, Clock, Play,
  X, Loader2, LogIn, Search, AlertCircle, Trophy, Hash,
} from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedSolve, setSelectedSolve] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true); setError(null);
    historyApi.getMy()
      .then(res => setRecords(Array.isArray(res.data) ? res.data : []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load solve history.'))
      .finally(() => setLoading(false));
  }, [user]);

  const fmt = (ms) => {
    if (ms == null) return '—';
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(2)}s`;
    return `${Math.floor(s / 60)}m ${(s % 60).toFixed(2).padStart(5, '0')}s`;
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const replayFacelets = useMemo(() => selectedSolve ? getScrambledState(selectedSolve.scrambleMoves) : null, [selectedSolve]);
  const replaySolution = useMemo(() => {
    if (!selectedSolve) return null;
    const moves = (selectedSolve.solutionMoves || '').trim().split(/\s+/).filter(Boolean);
    return { moves, moveCount: selectedSolve.moveCount || moves.length, solveTimeMs: selectedSolve.solveTimeMs || 0, solutionMoves: selectedSolve.solutionMoves };
  }, [selectedSolve]);

  const bestTimeMs = records.length ? Math.min(...records.map(r => r.solveTimeMs)) : null;

  const processedRecords = useMemo(() => {
    let result = [...records];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(r => String(r.id).includes(q) || (r.scrambleMoves && r.scrambleMoves.toLowerCase().includes(q)));
    }
    if (sortBy === 'fastest') result.sort((a, b) => a.solveTimeMs - b.solveTimeMs);
    else if (sortBy === 'fewest_moves') result.sort((a, b) => a.moveCount - b.moveCount);
    else result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [records, searchTerm, sortBy]);

  if (!user) {
    return (
      <div className="page-container flex-center" style={{ minHeight: '60vh' }}>
        <div style={{
          maxWidth: '400px', padding: '40px 32px', textAlign: 'center',
          background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(191,90,242,0.2)',
          borderRadius: '24px', backdropFilter: 'blur(20px)',
        }}>
          <LogIn size={36} color="#BF5AF2" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>Sign In Required</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
            Please sign in to view your solve history and replay past solutions in 3D.
          </p>
          <button onClick={() => navigate('/auth?mode=login')} className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #BF5AF2, #9b44c7)', boxShadow: '0 6px 20px rgba(191,90,242,0.4)' }}>
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#BF5AF2', margin: '0 auto 14px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Retrieving your solve history…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-bg-history" style={{ position: 'relative' }}>

      {/* Purple ambient glow */}
      <div className="orb-animate-1" style={{
        position: 'absolute', top: '5%', right: '10%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(191,90,242,0.1) 0%, transparent 70%)',
        filter: 'blur(45px)', pointerEvents: 'none',
      }} />

      <div className="container" style={{ paddingTop: '24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'rgba(191,90,242,0.15)', border: '1px solid rgba(191,90,242,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(191,90,242,0.25)',
            }}>
              <HistoryIcon size={20} color="#BF5AF2" />
            </div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', letterSpacing: '-0.025em' }}>
              Solve <span className="text-gradient-history">History</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            {records.length} recorded solve{records.length !== 1 ? 's' : ''} — replay any in 3D
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

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by ID or scramble…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '40px', paddingRight: '14px', minHeight: '44px',
                fontSize: '0.88rem', borderRadius: '12px',
                borderColor: 'rgba(191,90,242,0.2)',
              }}
            />
          </div>

          <div style={{ display: 'flex', background: 'rgba(11,16,32,0.7)', padding: '3px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', gap: '2px' }}>
            {[
              { id: 'newest', label: 'Newest' },
              { id: 'fastest', label: 'Fastest' },
              { id: 'fewest_moves', label: 'Fewest' },
            ].map(s => (
              <button key={s.id} onClick={() => setSortBy(s.id)} style={{
                padding: '6px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-main)', fontWeight: '600', fontSize: '0.8rem', transition: 'all 0.15s',
                background: sortBy === s.id ? 'linear-gradient(135deg, #BF5AF2, #9b44c7)' : 'transparent',
                color: sortBy === s.id ? '#fff' : 'var(--text-secondary)',
                boxShadow: sortBy === s.id ? '0 3px 10px rgba(191,90,242,0.35)' : 'none',
              }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Solve Cards */}
        {processedRecords.length === 0 ? (
          <div style={{
            padding: '60px 24px', textAlign: 'center',
            background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px',
          }}>
            <HistoryIcon size={38} style={{ color: 'var(--text-muted)', margin: '0 auto 14px', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
              {searchTerm ? 'No matching solves' : 'No solves recorded yet'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
              {searchTerm ? 'Try a different search term.' : 'Complete a solve in Practice Mode or 3D Solver!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {processedRecords.map((solve, i) => {
              const isBest = solve.solveTimeMs === bestTimeMs;
              return (
                <div
                  key={solve.id}
                  style={{
                    padding: '18px 20px',
                    background: 'rgba(26,34,53,0.65)',
                    border: `1px solid ${isBest ? 'rgba(255,214,10,0.25)' : 'rgba(191,90,242,0.15)'}`,
                    borderRadius: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: `slideInUp 0.4s var(--ease-smooth) ${Math.min(i, 5) * 0.06}s both`,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Top accent line */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: isBest
                      ? 'linear-gradient(90deg, transparent, rgba(255,214,10,0.8), transparent)'
                      : 'linear-gradient(90deg, transparent, rgba(191,90,242,0.5), transparent)',
                    borderRadius: '20px 20px 0 0',
                  }} />

                  {/* Card content */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                        background: isBest ? 'rgba(255,214,10,0.12)' : 'rgba(191,90,242,0.1)',
                        border: `1px solid ${isBest ? 'rgba(255,214,10,0.3)' : 'rgba(191,90,242,0.2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isBest ? <Trophy size={20} color="#FFD60A" /> : <Clock size={20} color="#BF5AF2" />}
                      </div>
                      <div>
                        {isBest && (
                          <div style={{
                            fontSize: '0.68rem', fontWeight: '800', color: '#FFD60A',
                            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            🏆 Best Solve
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#BF5AF2', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                            {fmt(solve.solveTimeMs)}
                          </span>
                          <span style={{ fontSize: '0.88rem', color: '#5AC8FA', fontWeight: '700' }}>
                            {solve.moveCount} moves
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {fmtDate(solve.createdAt)} · #{solve.id}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedSolve(solve)}
                      style={{
                        padding: '9px 18px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #BF5AF2, #9b44c7)',
                        color: '#fff', fontFamily: 'var(--font-main)',
                        fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: '0 4px 14px rgba(191,90,242,0.35)',
                        transition: 'all 0.2s ease', flexShrink: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(191,90,242,0.5)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(191,90,242,0.35)'; }}
                    >
                      <Play size={13} /> Replay 3D
                    </button>
                  </div>

                  {/* Scramble */}
                  {solve.scrambleMoves && (
                    <div style={{
                      marginTop: '12px',
                      background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '8px',
                      fontSize: '0.74rem', fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)', whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Scramble:</span>
                      {solve.scrambleMoves}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 3D Replay Modal */}
        {selectedSolve && replayFacelets && replaySolution && (
          <div
            className="celebration-overlay"
            onClick={() => setSelectedSolve(null)}
            style={{ zIndex: 2000, padding: '16px' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: '700px', maxHeight: '92vh', overflowY: 'auto',
                padding: '24px', position: 'relative',
                background: 'rgba(17,24,39,0.95)',
                border: '1px solid rgba(191,90,242,0.25)',
                borderRadius: '28px',
                backdropFilter: 'blur(30px)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 50px rgba(191,90,242,0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                  Replaying Solve <span style={{ color: '#BF5AF2' }}>#{selectedSolve.id}</span>
                </h3>
                <button
                  onClick={() => setSelectedSolve(null)}
                  style={{
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <CubePlayer initialFacelets={replayFacelets} solution={replaySolution} onClose={() => setSelectedSolve(null)} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
