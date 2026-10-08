import React, { useState, useCallback } from 'react';
import { cubeApi } from '../api/cubeApi';
import CubeVisualizer from '../components/CubeVisualizer';
import CubeInput from '../components/CubeInput';
import CubePlayer from '../components/CubePlayer';
import {
  Play, Shuffle, CheckCircle, RotateCcw, Loader2,
  AlertCircle, CheckCheck, FlaskConical, ChevronDown, ChevronUp, Layers,
  Puzzle, Zap,
} from 'lucide-react';
import runTests from '../engine/cubeMoves.test';

const makeSolvedFacelets = () => {
  const f = [];
  for (let face = 0; face < 6; face++)
    for (let pos = 0; pos < 9; pos++)
      f.push(face);
  return f;
};

const FACE_LABELS = [
  'U (White)', 'R (Red)', 'F (Green)', 'D (Yellow)', 'L (Orange)', 'B (Blue)',
];

const FACE_COLORS = ['#F8FAFF', '#FF3B30', '#30D158', '#FFD60A', '#FF9500', '#0A84FF'];

export default function Solver() {
  const [facelets, setFacelets] = useState(makeSolvedFacelets);
  const [viewMode, setViewMode] = useState('3D');

  const [solution, setSolution] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [isSolving, setIsSolving] = useState(false);

  const [validation, setValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [showFaceCounts, setShowFaceCounts] = useState(false);

  const busy = isSolving || isScrambling || isValidating;

  const clearResults = () => { setSolution(null); setValidation(null); setError(null); };

  const handleReset = useCallback(() => {
    setFacelets(makeSolvedFacelets());
    clearResults();
    setPlayerOpen(false);
  }, []);

  const handleScramble = useCallback(async () => {
    setIsScrambling(true);
    clearResults();
    setPlayerOpen(false);
    try {
      const res = await cubeApi.scramble(20);
      setFacelets(Array.from(res.data.facelets));
    } catch (err) {
      setError(err.response?.data?.message || 'Scramble failed. Is the backend running?');
    } finally {
      setIsScrambling(false);
    }
  }, []);

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    setError(null);
    setSolution(null);
    setPlayerOpen(false);
    try {
      const res = await cubeApi.validate(facelets);
      setValidation({ valid: res.data.valid, errors: res.data.errors || [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Validation failed.');
    } finally {
      setIsValidating(false);
    }
  }, [facelets]);

  const handleSolve = useCallback(async () => {
    setIsSolving(true);
    clearResults();
    setPlayerOpen(false);
    try {
      const res = await cubeApi.solve(facelets);
      if (res.data.success) {
        setSolution({
          moves: res.data.moveList || [],
          solutionMoves: res.data.solutionMoves || '',
          moveCount: res.data.moveCount,
          solveTimeMs: res.data.solveTimeMs,
        });
        setPlayerOpen(true);
      } else {
        setError(res.data.message || 'Solver returned no solution.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Solve failed. Is the backend running?');
    } finally {
      setIsSolving(false);
    }
  }, [facelets]);

  const handleRunTests = useCallback(() => {
    try {
      const r = runTests();
      setTestResults(r);
    } catch (e) {
      setTestResults({ passed: 0, failed: 1, results: [{ name: 'Test runner error', ok: false, error: e.message }] });
    }
  }, []);

  return (
    <div className="page-container page-bg-solve" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Blue ambient glow */}
      <div className="orb-animate-2" style={{
        position: 'absolute', top: '5%', right: '5%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,132,255,0.1) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      <div className="container" style={{ paddingTop: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '11px',
                background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 14px rgba(10,132,255,0.25)',
              }}>
                <Puzzle size={18} color="#5AC8FA" />
              </div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', letterSpacing: '-0.025em' }}>
                Cube <span className="text-gradient-solve">Solver</span>
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              3D interactive solver powered by the Java Kociemba algorithm
            </p>
          </div>

          <button
            onClick={handleRunTests}
            className="btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.8rem', minHeight: '36px', borderRadius: '10px' }}
            title="Run JS engine unit tests"
          >
            <FlaskConical size={14} /> Engine Tests
          </button>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="animate-fade-in" style={{
            marginBottom: '16px', padding: '12px 16px', borderRadius: '12px',
            background: testResults.failed === 0 ? 'rgba(48,209,88,0.1)' : 'rgba(255,59,48,0.1)',
            border: `1px solid ${testResults.failed === 0 ? 'rgba(48,209,88,0.3)' : 'rgba(255,59,48,0.3)'}`,
            fontSize: '0.85rem',
          }}>
            <strong style={{ color: testResults.failed === 0 ? '#30D158' : '#ff8080' }}>
              JS Engine: {testResults.passed} passed, {testResults.failed} failed
            </strong>
            {testResults.failed === 0 && (
              <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                All {testResults.results.length} tests pass ✓
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="animate-fade-in" style={{
            background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)',
            borderRadius: '12px', padding: '12px 16px', marginBottom: '16px',
            display: 'flex', gap: '10px', alignItems: 'center',
          }}>
            <AlertCircle size={18} color="#FF3B30" style={{ flexShrink: 0 }} />
            <span style={{ color: '#ff8080', fontSize: '0.88rem' }}>{error}</span>
          </div>
        )}

        {/* Validation */}
        {validation && (
          <div className="animate-fade-in" style={{
            background: validation.valid ? 'rgba(48,209,88,0.1)' : 'rgba(255,59,48,0.1)',
            border: `1px solid ${validation.valid ? 'rgba(48,209,88,0.3)' : 'rgba(255,59,48,0.3)'}`,
            borderRadius: '12px', padding: '12px 16px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCheck size={18} color={validation.valid ? '#30D158' : '#FF3B30'} />
              <span style={{ fontWeight: '700', color: validation.valid ? '#30D158' : '#ff8080', fontSize: '0.88rem' }}>
                {validation.valid ? 'Valid cube configuration ✓' : 'Invalid cube configuration'}
              </span>
            </div>
            {validation.errors?.map((e, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: '#ff8080', marginTop: '4px', paddingLeft: '26px' }}>• {e}</div>
            ))}
          </div>
        )}

        {/* Main Layout */}
        <div className="solver-layout">

          {/* LEFT: 3D Visualizer / 2D Net Editor & Player */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Visualizer Panel */}
            <div style={{
              padding: '18px',
              background: 'rgba(17,24,39,0.75)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(10,132,255,0.18)', borderRadius: '24px',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Top blue stripe */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(10,132,255,0.7), transparent)',
                borderRadius: '24px 24px 0 0',
              }} />

              {/* Header: Title + Mode switch */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={17} color="#5AC8FA" />
                  <span style={{ fontWeight: '700', fontSize: '0.92rem', color: '#F8FAFF' }}>
                    {viewMode === '3D' ? '3D Cube View' : '2D Net Editor'}
                  </span>
                </div>

                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {['3D', '2D'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      style={{
                        padding: '5px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                        background: viewMode === mode ? 'linear-gradient(135deg, #0A84FF, #0066cc)' : 'transparent',
                        color: viewMode === mode ? '#ffffff' : 'var(--text-secondary)',
                        fontFamily: 'inherit', fontWeight: '700', fontSize: '0.82rem',
                        transition: 'all 0.2s',
                        boxShadow: viewMode === mode ? '0 3px 10px rgba(10,132,255,0.4)' : 'none',
                      }}
                    >
                      {mode === '3D' ? '3D View' : '2D Paint'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cube Canvas / 2D Input */}
              {viewMode === '3D' ? (
                <div style={{
                  borderRadius: '18px', overflow: 'hidden',
                  background: 'radial-gradient(circle at 50% 45%, rgba(10,132,255,0.05), rgba(11,16,32,0.7))',
                }}>
                  <CubeVisualizer
                    facelets={facelets}
                    height={window.innerWidth < 480 ? 320 : 400}
                    enableOrbit={true}
                    enableZoom={false}
                  />
                </div>
              ) : (
                <CubeInput
                  facelets={facelets}
                  setFacelets={f => { setFacelets(f); clearResults(); setPlayerOpen(false); }}
                  disabled={busy}
                />
              )}
            </div>

            {/* Solution Player */}
            {playerOpen && solution && (
              <CubePlayer
                initialFacelets={facelets}
                solution={solution}
                onClose={() => setPlayerOpen(false)}
              />
            )}

            {!playerOpen && solution && (
              <button
                onClick={() => setPlayerOpen(true)}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #30D158, #25a244)',
                  color: '#fff', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.95rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 6px 20px rgba(48,209,88,0.4)', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <Play size={18} /> Reopen Solution Player ({solution.moveCount} moves)
              </button>
            )}
          </div>

          {/* RIGHT: Action Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Actions Panel */}
            <div style={{
              padding: '20px',
              background: 'rgba(17,24,39,0.75)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(10,132,255,0.18)', borderRadius: '24px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(10,132,255,0.7), transparent)',
                borderRadius: '24px 24px 0 0',
              }} />

              <h2 style={{ fontSize: '0.85rem', marginBottom: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '800' }}>
                Cube Actions
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Solve */}
                <button
                  id="btn-solve"
                  onClick={handleSolve}
                  disabled={busy}
                  style={{
                    width: '100%', padding: '14px', fontSize: '1rem', borderRadius: '14px', border: 'none',
                    background: busy ? 'rgba(10,132,255,0.4)' : 'linear-gradient(135deg, #0A84FF 0%, #0066cc 100%)',
                    color: '#fff', fontFamily: 'inherit', fontWeight: '700',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: busy ? 'none' : '0 6px 20px rgba(10,132,255,0.5)',
                    transition: 'all 0.2s ease', minHeight: '50px',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => { if (!busy) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {isSolving ? (
                    <><Loader2 size={20} className="animate-spin" /><span>Solving with Java Engine…</span></>
                  ) : (
                    <><Zap size={20} /><span>Solve Cube</span></>
                  )}
                </button>

                {/* Scramble */}
                <button
                  id="btn-scramble"
                  className="btn-secondary"
                  onClick={handleScramble}
                  disabled={busy}
                  style={{ width: '100%', borderRadius: '12px' }}
                >
                  {isScrambling ? <Loader2 size={17} className="animate-spin" /> : <Shuffle size={17} color="#FF9500" />}
                  <span>Random Scramble</span>
                </button>

                {/* Validate */}
                <button
                  id="btn-validate"
                  className="btn-secondary"
                  onClick={handleValidate}
                  disabled={busy}
                  style={{ width: '100%', borderRadius: '12px' }}
                >
                  {isValidating ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle size={17} color="#30D158" />}
                  <span>Validate Configuration</span>
                </button>

                {/* Reset */}
                <button
                  id="btn-reset"
                  className="btn-secondary"
                  onClick={handleReset}
                  disabled={busy}
                  style={{ width: '100%', borderRadius: '12px' }}
                >
                  <RotateCcw size={17} />
                  <span>Reset to Solved</span>
                </button>
              </div>
            </div>

            {/* Facelet Distribution */}
            <div style={{
              padding: '18px',
              background: 'rgba(17,24,39,0.75)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '22px',
            }}>
              <div
                onClick={() => setShowFaceCounts(!showFaceCounts)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showFaceCounts ? '16px' : 0 }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  Facelet Color Distribution
                </span>
                <div style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: showFaceCounts ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDown size={16} />
                </div>
              </div>

              {showFaceCounts && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {FACE_LABELS.map((label, fi) => {
                    const count = facelets.filter(c => c === fi).length;
                    const ok = count === 9;
                    return (
                      <div key={fi} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '10px', height: '10px', borderRadius: '3px',
                            background: FACE_COLORS[fi], boxShadow: `0 0 6px ${FACE_COLORS[fi]}60`,
                          }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '64px', height: '5px', borderRadius: '5px',
                            background: 'rgba(255,255,255,0.07)', overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${Math.min(100, (count / 9) * 100)}%`,
                              height: '100%',
                              background: ok ? FACE_COLORS[fi] : '#FF3B30',
                              borderRadius: '5px',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <span style={{
                            color: ok ? FACE_COLORS[fi] : '#FF3B30',
                            fontWeight: '800', fontFamily: 'monospace', width: '28px', textAlign: 'right',
                          }}>
                            {count}/9
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
