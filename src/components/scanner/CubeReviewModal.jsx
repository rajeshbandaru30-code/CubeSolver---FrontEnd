import React, { useState, useMemo } from 'react';
import CubeVisualizer from '../CubeVisualizer';
import CubePlayer from '../CubePlayer';
import {
  CheckCircle2, AlertCircle, RotateCcw, Zap, Loader2,
  Layers, CheckCheck, Palette, Camera, ChevronRight, AlertTriangle
} from 'lucide-react';
import { CUBE_COLORS } from '../../engine/colorDetector';
import { validateCubeState, SCAN_STEPS } from '../../engine/cubeValidatorClient';
import { cubeApi } from '../../api/cubeApi';

/**
 * CubeReviewModal
 *
 * Professional final 6-face review and solver execution screen:
 * - Direct navigation to any face containing an error or review flag
 * - Interactive 3D WebGL preview (Three.js / React Three Fiber)
 * - Individual sticker editing with 6-color palette
 * - Live mathematical parity and sticker count validation
 * - Strict gating: "Solve Cube" is enabled ONLY after valid cube state is confirmed
 * - Direct integration with Spring Boot's /api/cube/solve and 3D step-by-step player
 */
export default function CubeReviewModal({
  facelets,
  onUpdateFacelets,
  onRescanFace,
  onResetAll,
}) {
  const [selectedStickerIdx, setSelectedStickerIdx] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [isValidatingApi, setIsValidatingApi] = useState(false);
  const [solution, setSolution] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [error, setError] = useState(null);
  const [apiValidationSuccess, setApiValidationSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('3D'); // '3D' | '2D'

  // Mathematical parity & color count validation
  const validation = useMemo(() => {
    return validateCubeState(facelets);
  }, [facelets]);

  // Handle color change for a specific sticker index
  const handleStickerColorChange = (idx, newColorId) => {
    const updated = [...facelets];
    updated[idx] = newColorId;
    onUpdateFacelets(updated);
    setSelectedStickerIdx(null);
    setApiValidationSuccess(false);
  };

  // Perform backend validation check via /api/cube/validate
  const handleBackendValidate = async () => {
    if (isValidatingApi || isSolving) return;
    if (!validation.valid) {
      setError(validation.errors[0] || 'Cube configuration does not satisfy physical parity laws.');
      return;
    }

    setIsValidatingApi(true);
    setError(null);
    try {
      const res = await cubeApi.validate(facelets);
      if (res.data.valid) {
        setApiValidationSuccess(true);
      } else {
        setError(res.data.errors?.join('; ') || 'Backend rejected cube configuration.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Validation request failed.');
    } finally {
      setIsValidatingApi(false);
    }
  };

  // Solve Cube using Spring Boot REST API
  const handleSolve = async () => {
    if (isSolving || isValidatingApi) return;
    if (!validation.valid) {
      setError('Please resolve all validation errors before solving.');
      return;
    }

    setIsSolving(true);
    setError(null);
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
        setError(res.data.message || 'Solver was unable to find a solution.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Solve failed. Ensure backend is running.');
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1020px', margin: '0 auto' }}>

      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 24px',
          borderRadius: '24px',
          background: 'rgba(17, 24, 39, 0.88)',
          border: '1px solid rgba(10, 132, 255, 0.28)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#F8FAFF', letterSpacing: '-0.02em' }}>
              Final Cube Review
            </h2>
            <span
              style={{
                fontSize: '0.74rem',
                padding: '4px 12px',
                borderRadius: '100px',
                background: validation.valid ? 'rgba(48, 209, 88, 0.18)' : 'rgba(255, 59, 48, 0.18)',
                color: validation.valid ? '#30D158' : '#FF3B30',
                border: `1px solid ${validation.valid ? 'rgba(48, 209, 88, 0.4)' : 'rgba(255, 59, 48, 0.4)'}`,
                fontWeight: '700',
              }}
            >
              {validation.valid ? 'Solvability Verified ✓' : 'Validation Error'}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
            Inspect the reconstructed cube in 3D or 2D. Correct any stickers if necessary, then solve.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === '3D' ? '2D' : '3D')}
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
          >
            <Layers size={15} /> Switch to {activeTab === '3D' ? '2D Face Grids' : '3D Cube'}
          </button>

          <button
            type="button"
            onClick={onResetAll}
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
          >
            <RotateCcw size={15} /> Reset All
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            background: 'rgba(255, 59, 48, 0.12)',
            border: '1px solid rgba(255, 59, 48, 0.35)',
            borderRadius: '16px',
            padding: '12px 16px',
            color: '#ff8080',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
          }}
        >
          <AlertCircle size={18} color="#FF3B30" style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Validation Status Card */}
      <div
        style={{
          background: validation.valid ? 'rgba(48, 209, 88, 0.08)' : 'rgba(255, 149, 0, 0.08)',
          border: `1px solid ${validation.valid ? 'rgba(48, 209, 88, 0.3)' : 'rgba(255, 149, 0, 0.3)'}`,
          borderRadius: '18px',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {validation.valid ? (
              <CheckCheck size={22} color="#30D158" />
            ) : (
              <AlertTriangle size={22} color="#FF9500" />
            )}
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.92rem', color: validation.valid ? '#30D158' : '#FFD60A' }}>
                {validation.valid
                  ? 'All 5 Mathematical Parity Laws Passed'
                  : 'Sticker Configuration Requires Correction'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {validation.valid
                  ? 'Color counts, fixed centers, corner orientation, edge orientation, and permutation parities are verified.'
                  : 'Resolve the errors listed below by tapping the relevant stickers.'}
              </div>
            </div>
          </div>

          {/* Color Count Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CUBE_COLORS.map((c) => {
              const count = validation.colorCounts ? validation.colorCounts[c.id] : 0;
              const ok = count === 9;
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: `1px solid ${ok ? 'rgba(255, 255, 255, 0.12)' : '#FF3B30'}`,
                    fontSize: '0.74rem',
                    fontWeight: '700',
                  }}
                  title={`${c.name}: ${count}/9 stickers`}
                >
                  <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: c.hex }} />
                  <span style={{ color: ok ? '#F8FAFF' : '#FF3B30' }}>
                    {c.code}: {count}/9
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed error bullets */}
        {!validation.valid && validation.errors && validation.errors.length > 0 && (
          <div style={{ marginTop: '12px', paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {validation.errors.map((errText, idx) => (
              <div key={idx} style={{ fontSize: '0.82rem', color: '#ffb380', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>• {errText}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Review View (3D Canvas / 2D Grids) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>

        {/* 3D Canvas */}
        {activeTab === '3D' && (
          <div
            style={{
              background: 'radial-gradient(circle at 50% 45%, rgba(10, 132, 255, 0.08), rgba(11, 16, 32, 0.85))',
              borderRadius: '24px',
              border: '1px solid rgba(10, 132, 255, 0.22)',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: '14px', left: '18px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="#5AC8FA" />
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#F8FAFF' }}>
                Interactive 3D Preview (Drag to Inspect All Faces)
              </span>
            </div>

            <CubeVisualizer
              facelets={facelets}
              height={380}
              enableOrbit={true}
              enableZoom={false}
            />
          </div>
        )}

        {/* 2D All 6 Faces Grid */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderRadius: '24px',
            background: 'rgba(17, 24, 39, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              All 6 Faces (Tap any sticker to adjust)
            </span>

            {/* Quick Palette when sticker is selected */}
            {selectedStickerIdx !== null && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(0, 0, 0, 0.55)',
                  padding: '4px 14px',
                  borderRadius: '100px',
                  border: '1px solid rgba(10, 132, 255, 0.35)',
                }}
              >
                <Palette size={13} color="#5AC8FA" />
                <span style={{ fontSize: '0.75rem', color: '#5AC8FA', fontWeight: '700' }}>Color:</span>
                {CUBE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleStickerColorChange(selectedStickerIdx, c.id)}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: c.hex,
                      border: `1px solid ${c.border}`,
                      cursor: 'pointer',
                      transition: 'transform 0.15s',
                    }}
                    title={c.name}
                    aria-label={`Assign color ${c.name}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 6 Face Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
              gap: '14px',
            }}
          >
            {SCAN_STEPS.map((step) => {
              const faceOffset = step.faceIndex * 9;
              return (
                <div
                  key={step.faceIndex}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: step.centerHex }}>
                      {step.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRescanFace(step.faceIndex)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.7rem',
                      }}
                      title={`Rescan ${step.name}`}
                    >
                      <Camera size={12} /> Rescan
                    </button>
                  </div>

                  {/* 3x3 Mini Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '3px',
                      background: '#090D16',
                      padding: '4px',
                      borderRadius: '8px',
                      width: '94px',
                      height: '94px',
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                      const globalIdx = faceOffset + i;
                      const colorId = facelets[globalIdx];
                      const colorHex = CUBE_COLORS[colorId]?.hex || '#FFFFFF';
                      const isSelected = selectedStickerIdx === globalIdx;
                      const isCenter = i === 4;

                      return (
                        <div
                          key={globalIdx}
                          onClick={() => setSelectedStickerIdx(isSelected ? null : globalIdx)}
                          style={{
                            background: colorHex,
                            borderRadius: '3px',
                            cursor: 'pointer',
                            border: isSelected
                              ? '2px solid #5AC8FA'
                              : '1px solid rgba(0, 0, 0, 0.35)',
                            boxShadow: isSelected ? '0 0 8px #5AC8FA' : 'none',
                            position: 'relative',
                            transition: 'all 0.15s',
                          }}
                          title={isCenter ? 'Center Sticker' : 'Click to Change Color'}
                        >
                          {isCenter && (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(0, 0, 0, 0.45)' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Validation & Solve Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleBackendValidate}
          disabled={isValidatingApi || !validation.valid}
          className="btn-secondary"
          style={{
            flex: '1 1 200px',
            padding: '16px',
            borderRadius: '16px',
            fontSize: '0.98rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '56px',
          }}
        >
          {isValidatingApi ? (
            <><Loader2 size={18} className="animate-spin" /><span>Verifying with Backend…</span></>
          ) : (
            <><CheckCheck size={18} color="#30D158" /><span>Validate Cube</span></>
          )}
        </button>

        <button
          type="button"
          onClick={handleSolve}
          disabled={isSolving || !validation.valid}
          style={{
            flex: '2 1 280px',
            padding: '16px',
            borderRadius: '16px',
            border: 'none',
            background: !validation.valid
              ? 'rgba(255, 255, 255, 0.08)'
              : isSolving
              ? 'rgba(10, 132, 255, 0.4)'
              : 'linear-gradient(135deg, #0A84FF 0%, #0066cc 100%)',
            color: !validation.valid ? 'var(--text-muted)' : '#ffffff',
            fontFamily: 'inherit',
            fontWeight: '800',
            fontSize: '1.05rem',
            cursor: !validation.valid || isSolving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: validation.valid && !isSolving ? '0 8px 28px rgba(10, 132, 255, 0.5)' : 'none',
            transition: 'all 0.2s ease',
            minHeight: '56px',
          }}
        >
          {isSolving ? (
            <><Loader2 size={22} className="animate-spin" /><span>Solving with Java Engine…</span></>
          ) : (
            <><Zap size={22} /><span>Solve Scanned Cube</span></>
          )}
        </button>
      </div>

      {/* 3D Solution Player Modal */}
      {playerOpen && solution && (
        <CubePlayer
          initialFacelets={facelets}
          solution={solution}
          onClose={() => setPlayerOpen(false)}
        />
      )}
    </div>
  );
}
