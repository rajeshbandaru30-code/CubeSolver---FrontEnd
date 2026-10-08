import React, { useState, useCallback } from 'react';
import { cubeApi } from '../api/cubeApi';
import { CheckCircle, ChevronRight, ChevronLeft, Play, Pause } from 'lucide-react';

const FACE_CHARS = ['U', 'R', 'F', 'D', 'L', 'B'];

/**
 * SolutionDisplay — shows the solver result with:
 * - move sequence as badges
 * - step-by-step navigation (apply each move to see intermediate states)
 * - move count + time stats
 */
export default function SolutionDisplay({ solution, facelets: initialFacelets }) {
  const { moves, moveCount, solveTimeMs, message } = solution;
  const [step, setStep] = useState(0); // 0 = initial (scrambled), moves.length = solved
  const [stepFacelets, setStepFacelets] = useState([...initialFacelets]);
  const [applying, setApplying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayRef] = useState({ timer: null });

  const totalSteps = moves.length;

  const applyStep = useCallback(async (currentFacelets, move) => {
    try {
      const res = await cubeApi.applyMove(currentFacelets, move);
      return Array.from(res.data.facelets);
    } catch {
      return currentFacelets;
    }
  }, []);

  const goNext = async () => {
    if (step >= totalSteps || applying) return;
    setApplying(true);
    const newFacelets = await applyStep(stepFacelets, moves[step]);
    setStepFacelets(newFacelets);
    setStep(s => s + 1);
    setApplying(false);
  };

  const goPrev = () => {
    // Reset to initial and replay up to step-1
    if (step === 0) return;
    const target = step - 1;
    replayTo(target);
  };

  const replayTo = async (targetStep) => {
    setApplying(true);
    let current = [...initialFacelets];
    for (let i = 0; i < targetStep; i++) {
      current = await applyStep(current, moves[i]);
    }
    setStepFacelets(current);
    setStep(targetStep);
    setApplying(false);
  };

  const toggleAutoPlay = async () => {
    if (autoPlay) {
      clearTimeout(autoPlayRef.timer);
      setAutoPlay(false);
    } else {
      setAutoPlay(true);
      let current = [...initialFacelets];
      let i = 0;
      const tick = async () => {
        if (i >= totalSteps) { setAutoPlay(false); return; }
        current = await applyStep(current, moves[i]);
        setStepFacelets([...current]);
        setStep(i + 1);
        i++;
        autoPlayRef.timer = setTimeout(tick, 600);
      };
      await replayTo(0);
      tick();
    }
  };

  const isSolved = step === totalSteps;

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={20} color="var(--success-color)" />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--success-color)' }}>
            {moveCount === 0 ? 'Already Solved!' : `Solution Found`}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Moves: <strong style={{ color: 'var(--primary-color)' }}>{moveCount}</strong>
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            Time: <strong style={{ color: '#f59e0b' }}>{solveTimeMs}ms</strong>
          </span>
        </div>
      </div>

      {/* Move sequence badges */}
      {moves.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {moves.map((move, idx) => (
            <span
              key={idx}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                fontWeight: '600',
                background: idx < step
                  ? 'rgba(16,185,129,0.2)'
                  : idx === step
                  ? 'rgba(99,102,241,0.4)'
                  : 'rgba(255,255,255,0.07)',
                border: idx === step
                  ? '1px solid rgba(99,102,241,0.6)'
                  : '1px solid transparent',
                color: idx < step ? 'var(--success-color)' : idx === step ? '#a5b4fc' : 'var(--text-primary)',
                transition: 'all 0.2s',
              }}
            >
              {move}
            </span>
          ))}
        </div>
      )}

      {/* Step-by-step controls */}
      {moves.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Step {step} / {totalSteps}
              {isSolved && <span style={{ color: 'var(--success-color)', marginLeft: '8px' }}>✓ Solved!</span>}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" onClick={goPrev} disabled={step === 0 || applying} style={{ padding: '6px 12px' }}>
                <ChevronLeft size={16} />
              </button>
              <button className="btn-secondary" onClick={toggleAutoPlay} disabled={applying && !autoPlay} style={{ padding: '6px 12px' }}>
                {autoPlay ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button className="btn-secondary" onClick={goNext} disabled={step >= totalSteps || applying} style={{ padding: '6px 12px' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(step / totalSteps) * 100}%`, background: 'linear-gradient(90deg, var(--primary-color), var(--success-color))', transition: 'width 0.3s ease', borderRadius: '4px' }} />
          </div>

          {step > 0 && (
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Use ← → buttons or Auto-Play to walk through the solution step by step.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
