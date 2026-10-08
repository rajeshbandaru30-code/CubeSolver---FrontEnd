import React, { useState } from 'react';
import { Play, Shuffle, CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { cubeApi } from '../api/cubeApi';

const FACE_CHARS = ['U', 'R', 'F', 'D', 'L', 'B'];

/**
 * CubeControls — used by the legacy Solver layout.
 * New Solver.jsx renders its own controls inline.
 * Kept for backwards compatibility.
 */
export default function CubeControls({ facelets, setFacelets, setSolution, isSolving, setIsSolving }) {
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  const [scrambling, setScrambling] = useState(false);

  const handleScramble = async () => {
    setScrambling(true);
    try {
      const res = await cubeApi.scramble(20);
      setFacelets(Array.from(res.data.facelets));
      setSolution([]);
      setError(null);
    } catch (err) {
      setError('Failed to generate scramble');
    } finally {
      setScrambling(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const res = await cubeApi.validate(facelets);
      if (res.data.valid) {
        setError(null);
        alert('✅ Cube state is valid!');
      } else {
        setError((res.data.errors || ['Invalid cube state']).join('; '));
      }
    } catch {
      setError('Validation failed — is the backend running?');
    } finally {
      setValidating(false);
    }
  };

  const handleSolve = async () => {
    setIsSolving(true);
    setError(null);
    setSolution([]);
    try {
      const res = await cubeApi.solve(facelets);
      if (res.data.success && res.data.solutionMoves) {
        setSolution(res.data.moveList || res.data.solutionMoves.split(' ').filter(Boolean));
      } else if (res.data.moveCount === 0) {
        alert('Cube is already solved!');
      } else {
        setError('No solution found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to solve cube.');
    } finally {
      setIsSolving(false);
    }
  };

  const handleReset = () => {
    const solved = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 9; j++) solved.push(i);
    setFacelets(solved);
    setSolution([]);
    setError(null);
  };

  const busy = isSolving || validating || scrambling;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', borderLeft: '4px solid var(--error-color)', padding: '12px', borderRadius: '4px', color: '#fca5a5', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      <button className="btn-primary" onClick={handleSolve} disabled={busy} style={{ width: '100%' }}>
        {isSolving ? <><Loader2 size={17} className="animate-spin" /> Solving…</> : <><Play size={17} /> Solve Cube</>}
      </button>

      <div className="grid-cols-2" style={{ gap: '12px' }}>
        <button className="btn-secondary" onClick={handleScramble} disabled={busy}>
          {scrambling ? <Loader2 size={16} className="animate-spin" /> : <Shuffle size={17} />} Scramble
        </button>
        <button className="btn-secondary" onClick={handleValidate} disabled={busy}>
          <CheckCircle size={17} /> {validating ? 'Checking…' : 'Validate'}
        </button>
      </div>

      <button className="btn-secondary" onClick={handleReset} disabled={busy} style={{ width: '100%' }}>
        <RotateCcw size={17} /> Reset to Solved
      </button>
    </div>
  );
}
