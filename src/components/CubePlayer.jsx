import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { computeAllStates, isSolved } from '../engine/cubeMoves';
import { cubeApi } from '../api/cubeApi';
import CubeVisualizer from './CubeVisualizer';
import CubeInput from './CubeInput';
import {
  Play, Pause, ChevronLeft, ChevronRight,
  RotateCcw, CheckCircle, AlertCircle, Loader2, Info,
} from 'lucide-react';

// ─── Internal move catalogue (drives animation only — NOT shown to user) ──────

const MOVE_INFO = {
  'U':  { face: 'Up',    axis: 'Y+', color: '#FFFFFF' },
  "U'": { face: 'Up',    axis: 'Y+', color: '#FFFFFF' },
  'U2': { face: 'Up',    axis: 'Y+', color: '#FFFFFF' },
  'D':  { face: 'Down',  axis: 'Y-', color: '#FACC15' },
  "D'": { face: 'Down',  axis: 'Y-', color: '#FACC15' },
  'D2': { face: 'Down',  axis: 'Y-', color: '#FACC15' },
  'R':  { face: 'Right', axis: 'X+', color: '#EF4444' },
  "R'": { face: 'Right', axis: 'X+', color: '#EF4444' },
  'R2': { face: 'Right', axis: 'X+', color: '#EF4444' },
  'L':  { face: 'Left',  axis: 'X-', color: '#F97316' },
  "L'": { face: 'Left',  axis: 'X-', color: '#F97316' },
  'L2': { face: 'Left',  axis: 'X-', color: '#F97316' },
  'F':  { face: 'Front', axis: 'Z+', color: '#22C55E' },
  "F'": { face: 'Front', axis: 'Z+', color: '#22C55E' },
  'F2': { face: 'Front', axis: 'Z+', color: '#22C55E' },
  'B':  { face: 'Back',  axis: 'Z-', color: '#3B82F6' },
  "B'": { face: 'Back',  axis: 'Z-', color: '#3B82F6' },
  'B2': { face: 'Back',  axis: 'Z-', color: '#3B82F6' },
};

// ─── Beginner-friendly display map (what the USER sees) ──────────────────────
// Raw notation is NEVER shown to the user.

const MOVE_DISPLAY = {
  'R':  { emoji: '➡️', label: 'RIGHT',  action: 'Turn once',    subtext: 'Rotate the right layer toward you' },
  "R'": { emoji: '➡️', label: 'RIGHT',  action: 'Reverse turn', subtext: 'Rotate the right layer away from you' },
  'R2': { emoji: '➡️', label: 'RIGHT',  action: 'Turn twice',   subtext: 'Rotate the right layer a half turn' },
  'L':  { emoji: '⬅️', label: 'LEFT',   action: 'Turn once',    subtext: 'Rotate the left layer away from you' },
  "L'": { emoji: '⬅️', label: 'LEFT',   action: 'Reverse turn', subtext: 'Rotate the left layer toward you' },
  'L2': { emoji: '⬅️', label: 'LEFT',   action: 'Turn twice',   subtext: 'Rotate the left layer a half turn' },
  'U':  { emoji: '⬆️', label: 'TOP',    action: 'Turn once',    subtext: 'Rotate the top layer to the right' },
  "U'": { emoji: '⬆️', label: 'TOP',    action: 'Reverse turn', subtext: 'Rotate the top layer to the left' },
  'U2': { emoji: '⬆️', label: 'TOP',    action: 'Turn twice',   subtext: 'Rotate the top layer a half turn' },
  'D':  { emoji: '⬇️', label: 'BOTTOM', action: 'Turn once',    subtext: 'Rotate the bottom layer to the left' },
  "D'": { emoji: '⬇️', label: 'BOTTOM', action: 'Reverse turn', subtext: 'Rotate the bottom layer to the right' },
  'D2': { emoji: '⬇️', label: 'BOTTOM', action: 'Turn twice',   subtext: 'Rotate the bottom layer a half turn' },
  'F':  { emoji: '🟢', label: 'FRONT',  action: 'Turn once',    subtext: 'Rotate the front layer clockwise' },
  "F'": { emoji: '🟢', label: 'FRONT',  action: 'Reverse turn', subtext: 'Rotate the front layer counter-clockwise' },
  'F2': { emoji: '🟢', label: 'FRONT',  action: 'Turn twice',   subtext: 'Rotate the front layer a half turn' },
  'B':  { emoji: '🔵', label: 'BACK',   action: 'Turn once',    subtext: 'Rotate the back layer clockwise' },
  "B'": { emoji: '🔵', label: 'BACK',   action: 'Reverse turn', subtext: 'Rotate the back layer counter-clockwise' },
  'B2': { emoji: '🔵', label: 'BACK',   action: 'Turn twice',   subtext: 'Rotate the back layer a half turn' },
};

const SPEEDS = [
  { label: '0.5×', value: 0.5, ms: 2000 },
  { label: '1×',   value: 1,   ms: 1000 },
  { label: '2×',   value: 2,   ms:  500 },
];

// ─── CubePlayer ─────────────────────────────────────────────────────────────

/**
 * CubePlayer
 *
 * Renders a full playback experience for a Rubik's Cube solution.
 *
 * State pre-computation strategy:
 *   All N+1 states are computed INSTANTLY via the JS engine (cubeMoves.js),
 *   which is an exact mirror of the Java CubeMoves.java implementation.
 *   The final state is then verified against the backend apply-move API
 *   to detect any divergence. The 3D visualizer always shows
 *   states[currentStep] — mathematically consistent with the Java engine.
 *
 * @param {number[]} initialFacelets  - 54-element int array (scrambled state)
 * @param {object}   solution         - { moves: string[], moveCount, solveTimeMs }
 * @param {Function} onClose          - called when player is dismissed
 */
// Invert move for stepping backward
function invertMove(move) {
  if (!move) return null;
  const face = move[0];
  if (move.endsWith("'")) return face;
  if (move.endsWith("2")) return move;
  return `${face}'`;
}

export default function CubePlayer({ initialFacelets, solution, onClose }) {
  const { moves = [], moveCount, solveTimeMs } = solution;

  // Pre-computed states: states[k] = facelets after moves[0..k-1]
  const [states, setStates] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('pending'); // pending|ok|mismatch|error
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingMove, setAnimatingMove] = useState(null);
  const [speed, setSpeed] = useState(SPEEDS[1]);         // default 1×
  const [viewMode, setViewMode] = useState('3D');

  const pauseTimerRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  const isAnimatingRef = useRef(isAnimating);
  isAnimatingRef.current = isAnimating;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const totalSteps = moves.length;

  // ── Compute all states on mount (synchronous, JS engine only) ──
  useEffect(() => {
    const allStates = computeAllStates(initialFacelets, moves);
    setStates(allStates);
    setCurrentStep(0);
    setIsPlaying(false);
    setIsAnimating(false);
    setAnimatingMove(null);
    setVerifyStatus('pending');

    // Verify final state against the backend asynchronously
    if (moves.length > 0) {
      cubeApi.applyMove(initialFacelets, moves[0])
        .then(res => {
          const backendFirst = Array.from(res.data.facelets);
          const jsFirst = allStates[1];
          const match = backendFirst.every((v, i) => v === jsFirst[i]);
          setVerifyStatus(match ? 'ok' : 'mismatch');
        })
        .catch(() => setVerifyStatus('error'));
    } else {
      setVerifyStatus('ok');
    }

    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [initialFacelets, moves]);

  // ── Start a physical layer turn ──
  const startMoveAnimation = useCallback((stepIndex, direction = 'forward') => {
    if (!states || stepIndex < 0 || stepIndex >= totalSteps) {
      setIsPlaying(false);
      setIsAnimating(false);
      setAnimatingMove(null);
      return;
    }

    const rawMove = moves[stepIndex];
    const move = direction === 'forward' ? rawMove : invertMove(rawMove);
    const animDuration = Math.round(speedRef.current.ms * 0.65);

    setIsAnimating(true);
    setAnimatingMove({
      move,
      direction,
      stepIndex,
      duration: animDuration,
      id: Date.now() + Math.random(),
    });
  }, [states, totalSteps, moves]);

  // ── Callback when the 3D visualizer finishes rotating the layer ──
  const handleAnimationComplete = useCallback(() => {
    setAnimatingMove(currentAnim => {
      if (!currentAnim) return null;
      const { direction, stepIndex } = currentAnim;
      const nextStep = direction === 'forward' ? stepIndex + 1 : stepIndex;

      setCurrentStep(nextStep);
      setIsAnimating(false);

      // If auto-play is still active and we moved forward, schedule the next move
      if (isPlayingRef.current && direction === 'forward') {
        if (nextStep < totalSteps) {
          const pauseDuration = Math.max(80, speedRef.current.ms - Math.round(speedRef.current.ms * 0.65));
          if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
          pauseTimerRef.current = setTimeout(() => {
            if (isPlayingRef.current) {
              startMoveAnimation(nextStep, 'forward');
            }
          }, pauseDuration);
        } else {
          setIsPlaying(false);
        }
      }
      return null;
    });
  }, [totalSteps, startMoveAnimation]);

  // ── Navigation ──
  const goTo = useCallback((step) => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    setIsPlaying(false);
    setIsAnimating(false);
    setAnimatingMove(null);
    setCurrentStep(Math.max(0, Math.min(step, totalSteps)));
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    if (isAnimatingRef.current || currentStepRef.current <= 0) return;
    if (isPlayingRef.current) {
      setIsPlaying(false);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    }
    startMoveAnimation(currentStepRef.current - 1, 'backward');
  }, [startMoveAnimation]);

  const goNext = useCallback(() => {
    if (isAnimatingRef.current || currentStepRef.current >= totalSteps) return;
    if (isPlayingRef.current) {
      setIsPlaying(false);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    }
    startMoveAnimation(currentStepRef.current, 'forward');
  }, [totalSteps, startMoveAnimation]);

  const restart = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    setIsPlaying(false);
    setIsAnimating(false);
    setAnimatingMove(null);
    setCurrentStep(0);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      // Pause
      setIsPlaying(false);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    } else {
      // Play
      if (currentStepRef.current >= totalSteps) {
        // At the end: restart and play
        setCurrentStep(0);
        setIsPlaying(true);
        setTimeout(() => startMoveAnimation(0, 'forward'), 60);
      } else {
        setIsPlaying(true);
        if (!isAnimatingRef.current) {
          startMoveAnimation(currentStepRef.current, 'forward');
        }
      }
    }
  }, [totalSteps, startMoveAnimation]);

  // ── Derived values ──
  const currentFacelets = useMemo(() => {
    if (!states) return initialFacelets;
    if (animatingMove) {
      return animatingMove.direction === 'forward'
        ? states[animatingMove.stepIndex]
        : states[animatingMove.stepIndex + 1];
    }
    return states[currentStep];
  }, [states, initialFacelets, animatingMove, currentStep]);

  const isAtStart = currentStep === 0;
  const isAtEnd   = currentStep === totalSteps;

  // Which raw move is currently active (for animation lookup only)
  const activeRawMove = animatingMove
    ? moves[animatingMove.stepIndex]
    : currentStep > 0
    ? moves[currentStep - 1]
    : null;
  const nextRawMove = !animatingMove && currentStep < totalSteps ? moves[currentStep] : null;

  // Beginner-friendly display objects
  const activeDisplay = activeRawMove ? MOVE_DISPLAY[activeRawMove] : null;
  const activeInfo    = activeRawMove ? MOVE_INFO[activeRawMove]    : null;
  const nextDisplay   = nextRawMove   ? MOVE_DISPLAY[nextRawMove]   : null;
  const nextInfo      = nextRawMove   ? MOVE_INFO[nextRawMove]      : null;

  // 1-based display step number
  const displayStep = animatingMove ? animatingMove.stepIndex + 1 : currentStep;

  if (!states) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '60px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
        <Loader2 size={32} color="var(--primary-color)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Computing {moves.length} moves…</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Header ── */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={20} color="var(--success-color)" />
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>
                {moveCount === 0 ? 'Already Solved' : `Solution: ${moveCount} steps`}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Solved in {solveTimeMs}ms · Follow the steps on your physical cube
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {verifyStatus === 'ok' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#6ee7b7', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '100px' }}>
                <CheckCircle size={13} /> Engine verified ✓
              </div>
            )}
            {verifyStatus === 'mismatch' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#fca5a5', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '100px' }}>
                <AlertCircle size={13} /> Sync mismatch
              </div>
            )}
            {onClose && (
              <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main layout: Cube LEFT | Controls RIGHT ── */}
      <div className="cube-player-layout">

        {/* ──── LEFT: 3D cube + step overview ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* View toggle + progress label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {isAtEnd
                ? <span style={{ color: 'var(--success-color)', fontWeight: '600' }}>✓ Cube solved!</span>
                : currentStep === 0 && !animatingMove
                ? <span>Ready — press Play ▶</span>
                : <span>Step <strong style={{ color: 'var(--text-primary)' }}>{displayStep}</strong> / {totalSteps}</span>
              }
            </div>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
              {['3D', '2D'].map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s',
                  background: viewMode === m ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === m ? 'white' : 'var(--text-secondary)',
                }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Cube view */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
            {viewMode === '3D'
              ? (
                <CubeVisualizer
                  facelets={currentFacelets}
                  animatingMove={animatingMove}
                  onAnimationComplete={handleAnimationComplete}
                  isSolved={isAtEnd}
                  height={window.innerWidth < 480 ? 300 : 380}
                />
              )
              : <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
                  <CubeInput facelets={currentFacelets} setFacelets={() => {}} disabled={true} />
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Read-only during playback.
                  </p>
                </div>
            }
          </div>

          {/* Progress bar */}
          <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: totalSteps > 0 ? `${(currentStep / totalSteps) * 100}%` : '0%',
              background: isAtEnd
                ? 'linear-gradient(90deg, var(--primary-color), var(--success-color))'
                : 'var(--primary-color)',
              borderRadius: '5px',
              transition: isAnimating ? 'none' : `width ${speed.ms * 0.8}ms ease`,
            }} />
          </div>

          {/* ── Beginner-friendly step overview list ── */}
          {moves.length > 0 && (
            <div style={{ padding: '14px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--surface-border)', maxHeight: '220px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                All Steps
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {moves.map((move, idx) => {
                  const disp = MOVE_DISPLAY[move];
                  const info = MOVE_INFO[move];
                  const done   = idx < currentStep;
                  const isCurrentAnimating = animatingMove && idx === animatingMove.stepIndex;
                  const active = (idx === currentStep - 1 && currentStep > 0 && !animatingMove) || isCurrentAnimating;
                  const isNext = idx === currentStep && !animatingMove;
                  return (
                    <button
                      key={idx}
                      onClick={() => goTo(idx + 1)}
                      title={`Step ${idx + 1}: ${disp?.label} — ${disp?.action}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px', borderRadius: '7px',
                        border: active
                          ? `1px solid ${info?.color || '#6366f1'}55`
                          : isNext
                          ? '1px solid rgba(99,102,241,0.4)'
                          : '1px solid transparent',
                        background: active
                          ? `${info?.color || '#6366f1'}15`
                          : isNext
                          ? 'rgba(99,102,241,0.1)'
                          : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s',
                        textAlign: 'left', width: '100%', fontFamily: 'inherit',
                        boxShadow: isCurrentAnimating ? `0 0 10px ${info?.color || '#6366f1'}33` : 'none',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', width: '18px', flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                        background: done ? 'var(--success-color)' : active ? (info?.color || 'var(--primary-color)') : isNext ? 'var(--primary-color)' : 'rgba(255,255,255,0.15)',
                      }} />
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{disp?.emoji}</span>
                      <span style={{
                        fontSize: '0.82rem', fontWeight: active ? '700' : '500', flex: 1,
                        color: done ? 'var(--success-color)' : active ? (info?.color || 'var(--primary-color)') : isNext ? '#a5b4fc' : 'var(--text-primary)',
                      }}>
                        {disp?.label}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {disp?.action}
                      </span>
                      {done && <CheckCircle size={11} color="var(--success-color)" style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ──── RIGHT: Move instruction card + Controls ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* ── Current move instruction card ── */}
          <div className="glass-panel" style={{ padding: '24px', minHeight: '220px' }}>

            {/* START state */}
            {currentStep === 0 && !animatingMove ? (
              <div style={{ textAlign: 'center', paddingTop: '12px' }}>
                <Info size={32} color="var(--primary-color)" style={{ marginBottom: '14px' }} />
                <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1rem', marginBottom: '10px' }}>
                  Ready to solve!
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.7' }}>
                  Press <strong style={{ color: 'var(--text-primary)' }}>▶ Play</strong> to watch each move
                  animate on the 3D cube, then copy it on your physical cube.<br />
                  Or use <strong style={{ color: 'var(--text-primary)' }}>›</strong> to step one move at a time.
                </p>
                {nextDisplay && (
                  <div style={{ marginTop: '20px', padding: '14px 20px', background: 'rgba(99,102,241,0.1)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>First move</div>
                    <div style={{ fontSize: '2.4rem', marginBottom: '4px' }}>{nextDisplay.emoji}</div>
                    <div style={{ fontWeight: '700', color: '#a5b4fc', fontSize: '1.1rem' }}>{nextDisplay.label}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{nextDisplay.action}</div>
                  </div>
                )}
              </div>

            /* END state */
            ) : isAtEnd && !animatingMove ? (
              <div style={{ textAlign: 'center', paddingTop: '14px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)',
                }}>
                  <CheckCircle size={36} color="var(--success-color)" />
                </div>
                <h3 style={{ color: '#6ee7b7', fontWeight: '800', fontSize: '1.4rem', marginBottom: '8px' }}>
                  Cube Solved!
                </h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '10px', minWidth: '90px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Total Moves</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{moveCount}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '10px', minWidth: '90px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Engine Time</span>
                    <strong style={{ fontSize: '1.1rem', color: '#f59e0b' }}>{solveTimeMs}ms</strong>
                  </div>
                </div>
                <button
                  onClick={restart}
                  className="btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.9rem', borderRadius: '10px' }}
                >
                  <RotateCcw size={16} /> Replay Solution
                </button>
              </div>

            /* ACTIVE move card */
            ) : activeDisplay ? (
              <>
                {/* Step counter + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: isAnimating ? '#34d399' : 'var(--text-secondary)', fontWeight: isAnimating ? '600' : '400', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {isAnimating ? '▶ Watch and copy' : 'Copy this move'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{displayStep}</strong>
                    {' / '}{totalSteps}
                  </div>
                </div>

                {/* Big move card */}
                <div style={{
                  padding: '20px 24px',
                  borderRadius: '14px',
                  background: activeInfo ? `${activeInfo.color}12` : 'rgba(99,102,241,0.1)',
                  border: `2px solid ${activeInfo?.color || '#6366f1'}44`,
                  boxShadow: isAnimating ? `0 0 28px ${activeInfo?.color || '#6366f1'}40` : 'none',
                  textAlign: 'center',
                  marginBottom: '16px',
                  transition: 'box-shadow 0.3s ease',
                }}>
                  <div style={{ fontSize: '3.2rem', marginBottom: '8px', lineHeight: 1 }}>
                    {activeDisplay.emoji}
                  </div>
                  <div style={{
                    fontSize: '2rem', fontWeight: '800', letterSpacing: '0.06em',
                    color: activeInfo?.color || 'var(--primary-color)',
                    marginBottom: '6px',
                  }}>
                    {activeDisplay.label}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {activeDisplay.action}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {activeDisplay.subtext}
                  </div>
                </div>

                {/* Next move preview */}
                {nextDisplay && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flexShrink: 0 }}>Next:</span>
                    <span style={{ fontSize: '1.1rem' }}>{nextDisplay.emoji}</span>
                    <span style={{ fontWeight: '600', color: '#a5b4fc', fontSize: '0.88rem' }}>{nextDisplay.label}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>— {nextDisplay.action}</span>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* ── Playback controls ── */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Playback
            </div>

            {/* WATCH → COPY → NEXT hint */}
            {!isAtStart && !isAtEnd && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '12px', fontSize: '0.78rem' }}>
                {['WATCH', '→', 'COPY', '→', 'NEXT'].map((t, i) => (
                  <span key={i} style={{
                    color: t === '→' ? 'rgba(255,255,255,0.3)' : 'var(--text-primary)',
                    fontWeight: t !== '→' ? '600' : '400',
                    background: t !== '→' ? 'rgba(99,102,241,0.15)' : 'transparent',
                    padding: t !== '→' ? '2px 7px' : '0 2px',
                    borderRadius: '4px',
                    letterSpacing: '0.04em',
                  }}>{t}</span>
                ))}
              </div>
            )}

            {/* Restart · Prev · Play/Pause · Next */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={restart}
                className="btn-secondary"
                title="Restart from beginning"
                style={{ padding: '10px 12px', flex: 1 }}
              >
                <RotateCcw size={17} />
              </button>
              <button
                onClick={goPrev}
                disabled={isAtStart || isAnimating}
                className="btn-secondary"
                title="Previous move"
                style={{ padding: '10px 12px', flex: 1, opacity: (isAtStart || isAnimating) ? 0.45 : 1 }}
              >
                <ChevronLeft size={19} />
              </button>
              <button
                onClick={togglePlay}
                className="btn-primary"
                title={isPlaying ? 'Pause' : 'Play'}
                style={{ padding: '10px 18px', flex: 2 }}
              >
                {isPlaying ? <Pause size={19} /> : <Play size={19} />}
              </button>
              <button
                onClick={goNext}
                disabled={isAtEnd || isAnimating}
                className="btn-secondary"
                title="Next move"
                style={{ padding: '10px 12px', flex: 1, opacity: (isAtEnd || isAnimating) ? 0.45 : 1 }}
              >
                <ChevronRight size={19} />
              </button>
            </div>

            {/* Speed selector */}
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Speed</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {SPEEDS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => setSpeed(s)}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: '7px', border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s',
                      background: speed.value === s.value ? 'var(--primary-color)' : 'rgba(255,255,255,0.08)',
                      color: speed.value === s.value ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Summary ── */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total steps</span>
                <strong style={{ color: 'var(--primary-color)' }}>{moveCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                <strong style={{ color: isAtEnd ? 'var(--success-color)' : 'var(--text-primary)' }}>
                  {currentStep} / {totalSteps}{isAtEnd ? ' ✓' : ''}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Solved in</span>
                <strong style={{ color: '#f59e0b' }}>{solveTimeMs}ms</strong>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}



