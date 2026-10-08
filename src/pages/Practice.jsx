import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cubeApi, historyApi } from '../api/cubeApi';
import { useAuth } from '../context/AuthContext';
import CubeVisualizer from '../components/CubeVisualizer';
import { applyMove, isSolved } from '../engine/cubeMoves';
import {
  Play, RotateCcw, Shuffle, Trophy, Clock, Zap,
  CheckCircle2, AlertCircle, Copy, Check,
} from 'lucide-react';

const MOVE_GROUPS = [
  { face: 'U', name: 'Up',    color: '#F8FAFF', textColor: '#0B1020', moves: ['U', "U'", 'U2'] },
  { face: 'R', name: 'Right', color: '#FF3B30', textColor: '#ffffff', moves: ['R', "R'", 'R2'] },
  { face: 'F', name: 'Front', color: '#30D158', textColor: '#ffffff', moves: ['F', "F'", 'F2'] },
  { face: 'D', name: 'Down',  color: '#FFD60A', textColor: '#0B1020', moves: ['D', "D'", 'D2'] },
  { face: 'L', name: 'Left',  color: '#FF9500', textColor: '#ffffff', moves: ['L', "L'", 'L2'] },
  { face: 'B', name: 'Back',  color: '#0A84FF', textColor: '#ffffff', moves: ['B', "B'", 'B2'] },
];

const makeSolvedFacelets = () => {
  const f = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 9; j++) f.push(i);
  return f;
};

export default function Practice() {
  const { user } = useAuth();

  const [facelets, setFacelets] = useState(makeSolvedFacelets());
  const [scramble, setScramble] = useState('');
  const [userMoves, setUserMoves] = useState([]);
  const [sessionStatus, setSessionStatus] = useState('idle'); // 'idle' | 'running' | 'solved'
  const [elapsed, setElapsed] = useState(0);
  const [isLoadingScramble, setIsLoadingScramble] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [copiedScramble, setCopiedScramble] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const formatTime = ms => {
    if (ms == null) return '0.00';
    const s = ms / 1000;
    if (s < 60) return s.toFixed(2);
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(2).padStart(5, '0');
    return `${mins}:${secs}`;
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (startTimeRef.current) {
      const final = Date.now() - startTimeRef.current;
      setElapsed(final);
      return final;
    }
    return elapsed;
  }, [elapsed]);

  const handleStartPractice = useCallback(async () => {
    clearInterval(timerRef.current);
    setIsLoadingScramble(true);
    setSavedToDb(false);
    setSaveError(null);
    setUserMoves([]);
    setElapsed(0);
    setSessionStatus('idle');
    try {
      const res = await cubeApi.scramble(20);
      setFacelets(Array.from(res.data.facelets));
      setScramble(res.data.scrambleMoves || '');
      setSessionStatus('running');
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 25);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to generate scramble.');
    } finally {
      setIsLoadingScramble(false);
    }
  }, []);

  const handleMove = useCallback(async move => {
    if (sessionStatus !== 'running') return;
    setFacelets(prevFacelets => {
      const nextFacelets = applyMove(prevFacelets, move);
      const nextMoves = [...userMoves, move];
      setUserMoves(nextMoves);
      if (isSolved(nextFacelets)) {
        const finalTime = stopTimer();
        setSessionStatus('solved');
        if (user) {
          historyApi.recordSolve({
            cubeState: nextFacelets.join(','),
            scrambleMoves: scramble,
            solutionMoves: nextMoves.join(' '),
            moveCount: nextMoves.length,
            solveTimeMs: finalTime,
          }).then(() => setSavedToDb(true)).catch(err => setSaveError(err.response?.data?.message || 'Failed to save.'));
        }
      }
      return nextFacelets;
    });
  }, [sessionStatus, userMoves, scramble, user, stopTimer]);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (sessionStatus === 'running') { stopTimer(); setSessionStatus('idle'); }
        else if (sessionStatus === 'idle') { handleStartPractice(); }
        return;
      }
      const key = e.key.toUpperCase();
      if (['U', 'D', 'L', 'R', 'F', 'B'].includes(key)) {
        e.preventDefault();
        handleMove(e.shiftKey ? `${key}'` : key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionStatus, handleMove, handleStartPractice, stopTimer]);

  const handleReset = () => {
    clearInterval(timerRef.current);
    setSessionStatus('idle');
    setElapsed(0);
    setFacelets(makeSolvedFacelets());
    setScramble('');
    setUserMoves([]);
    setSavedToDb(false);
    setSaveError(null);
  };

  const handleCopyScramble = () => {
    if (!scramble) return;
    navigator.clipboard.writeText(scramble);
    setCopiedScramble(true);
    setTimeout(() => setCopiedScramble(false), 1800);
  };

  const tps = elapsed > 0 ? (userMoves.length / (elapsed / 1000)).toFixed(1) : '0.0';
  const isRunning = sessionStatus === 'running';
  const isSolvedState = sessionStatus === 'solved';

  return (
    <div className="page-container page-bg-practice" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Green ambient */}
      <div className="orb-animate-1" style={{
        position: 'absolute', top: '5%', right: '5%',
        width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(48,209,88,0.09) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      <div className="container" style={{ paddingTop: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '11px',
                background: 'rgba(48,209,88,0.15)', border: '1px solid rgba(48,209,88,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 14px rgba(48,209,88,0.2)',
              }}>
                <Clock size={18} color="#30D158" />
              </div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', letterSpacing: '-0.025em' }}>
                Practice <span className="text-gradient-practice">Timer</span>
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              Speedcubing arena with automatic solve detection
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleStartPractice}
              disabled={isLoadingScramble}
              style={{
                padding: '9px 18px', fontSize: '0.9rem', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #30D158, #25a244)',
                color: '#fff', fontFamily: 'var(--font-main)', fontWeight: '700',
                cursor: isLoadingScramble ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '7px',
                boxShadow: '0 4px 16px rgba(48,209,88,0.4)',
                minHeight: '42px', opacity: isLoadingScramble ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              <Shuffle size={16} /> {isRunning ? 'New Scramble' : 'Start Practice'}
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary"
              style={{ padding: '9px 14px', minHeight: '42px', borderRadius: '12px' }}
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Scramble Banner */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px', gap: '12px',
          background: 'rgba(11,16,32,0.6)',
          border: '1px solid rgba(48,209,88,0.15)',
          borderRadius: '14px', padding: '14px 18px',
        }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '3px' }}>
              WCA Scramble
            </span>
            <div style={{ fontSize: '0.9rem', color: '#30D158', fontWeight: '700', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.04em' }}>
              {scramble || <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>Press "Start Practice" to generate scramble</span>}
            </div>
          </div>
          {scramble && (
            <button
              onClick={handleCopyScramble}
              className="btn-secondary"
              style={{ padding: '6px 10px', minHeight: '32px', borderRadius: '8px', flexShrink: 0 }}
              title="Copy scramble"
            >
              {copiedScramble ? <Check size={14} color="#30D158" /> : <Copy size={14} />}
            </button>
          )}
        </div>

        {/* Main Arena */}
        <div className="practice-layout">

          {/* LEFT: Timer + 3D Cube */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Giant Timer */}
            <div
              onClick={() => {
                if (isRunning) { stopTimer(); setSessionStatus('idle'); }
                else if (sessionStatus === 'idle') handleStartPractice();
              }}
              style={{
                padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                background: 'rgba(17,24,39,0.75)', backdropFilter: 'blur(16px)',
                border: `1px solid ${isRunning ? 'rgba(48,209,88,0.25)' : isSolvedState ? 'rgba(48,209,88,0.4)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '24px', position: 'relative', overflow: 'hidden',
                boxShadow: isRunning ? '0 0 40px rgba(48,209,88,0.1)' : isSolvedState ? '0 0 60px rgba(48,209,88,0.2)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Top glow line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: isRunning
                  ? 'linear-gradient(90deg, transparent, #30D158, transparent)'
                  : isSolvedState ? 'linear-gradient(90deg, transparent, #30D158, transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                borderRadius: '24px 24px 0 0',
              }} />

              <span style={{
                fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.1em', display: 'block', marginBottom: '6px',
              }}>
                {isRunning ? 'Timer Running · Tap or Spacebar to Stop'
                  : isSolvedState ? '🎉 Solve Complete!'
                  : 'Tap or Press Spacebar to Start'}
              </span>

              <div
                className={`speed-timer ${isRunning ? 'running' : isSolvedState ? 'solved' : ''}`}
                style={{
                  fontSize: 'clamp(3.5rem, 14vw, 6rem)',
                  color: isRunning ? '#5AC8FA' : isSolvedState ? '#30D158' : '#F8FAFF',
                }}
              >
                {formatTime(elapsed)}
              </div>

              {/* Status pills */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '14px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 12px', borderRadius: '100px',
                  background: 'rgba(90,200,250,0.1)', border: '1px solid rgba(90,200,250,0.2)',
                  fontSize: '0.77rem', fontWeight: '700', color: '#5AC8FA',
                }}>
                  <Zap size={12} color="#FFD60A" /> {userMoves.length} moves
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 12px', borderRadius: '100px',
                  background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)',
                  fontSize: '0.77rem', fontWeight: '700', color: '#30D158',
                }}>
                  {tps} TPS
                </span>
              </div>
            </div>

            {/* 3D Cube */}
            <div style={{
              borderRadius: '24px', overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'radial-gradient(circle at 50% 45%, rgba(48,209,88,0.05), rgba(11,16,32,0.6))',
              position: 'relative',
            }}>
              <CubeVisualizer
                facelets={facelets}
                isSolved={isSolvedState}
                height={window.innerWidth < 480 ? 300 : 360}
                enableOrbit={true}
                enableZoom={false}
              />
            </div>
          </div>

          {/* RIGHT: Move Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{
              padding: '20px',
              background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '24px', backdropFilter: 'blur(16px)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '800' }}>
                  Touch Move Controls
                </h2>
                <span style={{
                  fontSize: '0.68rem', color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: '100px',
                }}>
                  U D L R F B
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {MOVE_GROUPS.map(({ face, name, color, textColor, moves }) => (
                  <div
                    key={face}
                    style={{
                      padding: '12px',
                      background: 'rgba(0,0,0,0.25)',
                      borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                      <div style={{
                        width: '14px', height: '14px', borderRadius: '3px',
                        background: color, border: '1.5px solid rgba(0,0,0,0.3)',
                        boxShadow: `0 0 8px ${color}60`,
                      }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                        {name} ({face})
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                      {moves.map(m => (
                        <button
                          key={m}
                          onClick={() => handleMove(m)}
                          disabled={!isRunning}
                          style={{
                            flex: 1,
                            padding: '9px 0',
                            borderRadius: '9px',
                            border: `1px solid ${isRunning ? `${color}40` : 'rgba(255,255,255,0.05)'}`,
                            background: isRunning ? `${color}10` : 'rgba(255,255,255,0.03)',
                            color: isRunning ? color : 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            cursor: isRunning ? 'pointer' : 'not-allowed',
                            opacity: isRunning ? 1 : 0.4,
                            transition: 'all 0.12s ease',
                            letterSpacing: '-0.01em',
                          }}
                          onMouseEnter={e => { if (isRunning) { e.currentTarget.style.background = `${color}20`; e.currentTarget.style.transform = 'scale(1.05)'; } }}
                          onMouseLeave={e => { e.currentTarget.style.background = isRunning ? `${color}10` : 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'scale(1)'; }}
                          onMouseDown={e => { if (isRunning) e.currentTarget.style.transform = 'scale(0.95)'; }}
                          onMouseUp={e => { if (isRunning) e.currentTarget.style.transform = 'scale(1.05)'; }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tip */}
            <div style={{
              padding: '16px 18px',
              background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.15)',
              borderRadius: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55,
            }}>
              <strong style={{ color: '#30D158' }}>💡 Pro Tip:</strong> Press Spacebar to start. CubeSolve auto-detects completion and records your solve to MySQL.
            </div>
          </div>

        </div>

        {/* Solved Celebration Modal */}
        {isSolvedState && (
          <div className="celebration-overlay" onClick={() => setSessionStatus('idle')}>
            <div className="celebration-modal" onClick={e => e.stopPropagation()}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(48,209,88,0.15)', border: '2px solid rgba(48,209,88,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', boxShadow: '0 0 40px rgba(48,209,88,0.4)',
              }}>
                <Trophy size={38} color="#30D158" />
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '6px', color: '#30D158', letterSpacing: '-0.025em' }}>
                Cube Solved! 🎉
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '22px' }}>
                Outstanding solve! Here are your official stats:
              </p>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px', marginBottom: '22px',
              }}>
                {[
                  { label: 'Time',  value: `${formatTime(elapsed)}s`, color: '#5AC8FA' },
                  { label: 'Moves', value: userMoves.length,          color: '#F8FAFF' },
                  { label: 'Speed', value: `${tps} TPS`,             color: '#FF9500' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.05)', padding: '12px 8px',
                    borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{label}</span>
                    <strong style={{ fontSize: '1.2rem', color, fontFamily: 'var(--font-mono)' }}>{value}</strong>
                  </div>
                ))}
              </div>

              {savedToDb && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', fontSize: '0.8rem', color: '#30D158', marginBottom: '20px',
                }}>
                  <CheckCircle2 size={14} /> Solve record saved to your account
                </div>
              )}
              {saveError && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', fontSize: '0.8rem', color: '#FF3B30', marginBottom: '18px',
                }}>
                  <AlertCircle size={14} /> {saveError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleStartPractice}
                  style={{
                    flex: 1, padding: '13px', borderRadius: '14px', border: 'none',
                    background: 'linear-gradient(135deg, #30D158, #25a244)',
                    color: '#fff', fontFamily: 'var(--font-main)', fontWeight: '700', fontSize: '0.92rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 6px 20px rgba(48,209,88,0.45)',
                  }}
                >
                  <Shuffle size={16} /> Next Scramble
                </button>
                <button
                  onClick={() => setSessionStatus('idle')}
                  className="btn-secondary"
                  style={{ flex: 1, borderRadius: '14px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
