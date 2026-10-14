import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraFeed from '../components/scanner/CameraFeed';
import ScanOverlay from '../components/scanner/ScanOverlay';
import FaceCaptureCard from '../components/scanner/FaceCaptureCard';
import CubeReviewModal from '../components/scanner/CubeReviewModal';
import ProgressSteps from '../components/scanner/ProgressSteps';
import CalibrationModal from '../components/scanner/CalibrationModal';
import { SCAN_STEPS } from '../engine/cubeValidatorClient';
import {
  Camera, ArrowLeft, HelpCircle, Sliders, Volume2, VolumeX,
  AlertTriangle, RotateCcw, Layers, Sparkles, X,
} from 'lucide-react';

// Web Audio API tone synthesis for tactile audio feedback
function playTone(freq = 520, duration = 0.08, type = 'sine') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio context initialization blocked before user interaction
  }
}

export default function Scanner() {
  const navigate = useNavigate();

  // Active scanning face: 0..5 (U, R, F, D, L, B)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Scanned faces dictionary: { [faceIndex]: [9 sticker objects] }
  const [scannedFaces, setScannedFaces] = useState({});

  // Temporary captured stickers for the currently active face (before user confirmation)
  const [pendingStickers, setPendingStickers] = useState(null);

  // Live real-time stickers & quality from camera feed
  const [liveStickers, setLiveStickers] = useState(null);
  const [liveFrameQuality, setLiveFrameQuality] = useState(null);

  // Calibration state & prototypes
  const [calibrationPrototypes, setCalibrationPrototypes] = useState(null);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);

  // Review mode (shown after all 6 faces are confirmed or when explicitly toggled)
  const [reviewMode, setReviewMode] = useState(false);

  // Modals state
  const [showGuide, setShowGuide] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Sound feedback toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentStep = SCAN_STEPS[currentStepIndex];

  // Haptic & Audio feedback helper
  const triggerFeedback = useCallback((freq = 580, duration = 0.09) => {
    if (navigator.vibrate) {
      try { navigator.vibrate(35); } catch (e) {}
    }
    if (soundEnabled) {
      playTone(freq, duration);
    }
  }, [soundEnabled]);

  // Handle live frame from CameraFeed
  const handleLiveFrame = useCallback(({ stickers, quality }) => {
    setLiveStickers(stickers);
    if (quality) setLiveFrameQuality(quality);
  }, []);

  // Handle quality update
  const handleQualityUpdate = useCallback((quality) => {
    setLiveFrameQuality(quality);
  }, []);

  // Handle capture of the current face
  const handleCapture = useCallback((detectedStickers) => {
    triggerFeedback(660, 0.1);
    setPendingStickers(detectedStickers);
  }, [triggerFeedback]);

  // Handle retaking the current face
  const handleRetake = useCallback(() => {
    triggerFeedback(380, 0.08);
    setPendingStickers(null);
  }, [triggerFeedback]);

  // Handle updating stickers in the capture card
  const handleUpdateStickers = useCallback((updated) => {
    setPendingStickers(updated);
  }, []);

  // Handle confirming the current face
  const handleConfirmFace = useCallback(() => {
    if (!pendingStickers) return;
    triggerFeedback(880, 0.12);

    setScannedFaces((prev) => {
      const updated = { ...prev, [currentStepIndex]: pendingStickers };

      // If all 6 faces are confirmed, proceed to final cube review
      const completedCount = Object.keys(updated).length;
      if (completedCount === 6) {
        setReviewMode(true);
      } else {
        // Find the next unconfirmed face
        let nextIdx = (currentStepIndex + 1) % 6;
        while (updated[nextIdx] && Object.keys(updated).length < 6) {
          nextIdx = (nextIdx + 1) % 6;
        }
        setCurrentStepIndex(nextIdx);
      }
      return updated;
    });

    setPendingStickers(null);
  }, [pendingStickers, currentStepIndex, triggerFeedback]);

  // Convert scanned faces to standard 54-element facelet array
  const reconstructedFacelets = useMemo(() => {
    const arr = new Array(54).fill(0);
    for (let face = 0; face < 6; face++) {
      const faceStickers = scannedFaces[face];
      for (let pos = 0; pos < 9; pos++) {
        const globalIdx = face * 9 + pos;
        if (faceStickers && faceStickers[pos]) {
          arr[globalIdx] = faceStickers[pos].colorId;
        } else {
          arr[globalIdx] = face; // default to solved face color
        }
      }
    }
    return arr;
  }, [scannedFaces]);

  // Update facelets directly from review screen
  const handleUpdateFacelets = useCallback((newFacelets) => {
    const newScanned = {};
    for (let face = 0; face < 6; face++) {
      newScanned[face] = [];
      for (let pos = 0; pos < 9; pos++) {
        const colorId = newFacelets[face * 9 + pos];
        newScanned[face].push({
          index: pos,
          colorId,
          confidence: 100,
          needsReview: false,
          source: 'user',
        });
      }
    }
    setScannedFaces(newScanned);
  }, []);

  // Rescan a specific face from review screen
  const handleRescanFace = useCallback((faceIndex) => {
    setCurrentStepIndex(faceIndex);
    setPendingStickers(null);
    setReviewMode(false);
  }, []);

  // Reset all scans
  const handleResetAll = useCallback(() => {
    setScannedFaces({});
    setPendingStickers(null);
    setCurrentStepIndex(0);
    setReviewMode(false);
  }, []);

  // Handle Back button with confirmation if scans exist
  const handleBack = () => {
    const hasScans = Object.keys(scannedFaces).length > 0 || pendingStickers;
    if (hasScans) {
      setShowExitConfirm(true);
    } else {
      navigate('/solver');
    }
  };

  const totalCompleted = Object.keys(scannedFaces).length;

  return (
    <div className="page-container page-bg-solve" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Deep Navy Atmosphere glow */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '10%',
          width: '440px',
          height: '440px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(10, 132, 255, 0.08) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ paddingTop: '16px', paddingBottom: '75px' }}>

        {/* Compact Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary"
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
              }}
              title="Return to Solver"
            >
              <ArrowLeft size={16} /> <span>Back</span>
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.55rem)', fontWeight: '800', letterSpacing: '-0.02em', color: '#F8FAFF' }}>
                  Cube <span className="text-gradient">Scanner</span>
                </h1>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    color: totalCompleted === 6 ? '#30D158' : '#5AC8FA',
                    background: totalCompleted === 6 ? 'rgba(48, 209, 88, 0.15)' : 'rgba(10, 132, 255, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '100px',
                    border: `1px solid ${totalCompleted === 6 ? 'rgba(48, 209, 88, 0.35)' : 'rgba(10, 132, 255, 0.35)'}`,
                  }}
                >
                  {reviewMode ? 'Review Stage' : `${totalCompleted}/6 Scanned`}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Calibration button */}
            <button
              type="button"
              onClick={() => setIsCalibrationOpen(true)}
              className="btn-secondary"
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderColor: calibrationPrototypes ? 'rgba(48, 209, 88, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                color: calibrationPrototypes ? '#30D158' : 'var(--text-secondary)',
              }}
              title="Ambient Light Calibration"
            >
              <Sliders size={15} /> <span>Calibrate</span>
            </button>

            {/* Sound toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn-secondary"
              style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.82rem' }}
              title={soundEnabled ? 'Mute Audio Feedback' : 'Enable Audio Feedback'}
            >
              {soundEnabled ? <Volume2 size={16} color="#30D158" /> : <VolumeX size={16} color="var(--text-muted)" />}
            </button>

            {/* Guide Button */}
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="btn-secondary"
              style={{ padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}
            >
              <HelpCircle size={15} color="#5AC8FA" /> <span>Guide</span>
            </button>

            {/* Review Toggle Button */}
            {totalCompleted > 0 && (
              <button
                type="button"
                onClick={() => setReviewMode(!reviewMode)}
                className="btn-primary"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  background: 'linear-gradient(135deg, #0A84FF 0%, #0066cc 100%)',
                }}
              >
                <Layers size={14} /> <span>{reviewMode ? 'Back to Camera' : `Review (${totalCompleted}/6)`}</span>
              </button>
            )}
          </div>
        </div>

        {/* REVIEW MODE: Display Reconstructed 3D Cube, Parity Verification, & Solver */}
        {reviewMode ? (
          <div className="animate-fade-in">
            <CubeReviewModal
              facelets={reconstructedFacelets}
              onUpdateFacelets={handleUpdateFacelets}
              onRescanFace={handleRescanFace}
              onResetAll={handleResetAll}
            />
          </div>
        ) : (
          /* SCANNING MODE: Guided 6-Face Camera Workflow */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Six-Face Progress Component */}
            <ProgressSteps
              currentStepIndex={currentStepIndex}
              scannedFaces={scannedFaces}
              pendingFaceIndex={pendingStickers ? currentStepIndex : null}
              onSelectFace={(idx) => {
                setCurrentStepIndex(idx);
                setPendingStickers(null);
              }}
            />

            {/* Current Step Guidance Banner */}
            <div
              className="glass-panel"
              style={{
                padding: '12px 18px',
                borderRadius: '16px',
                background: 'rgba(17, 24, 39, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: currentStep.centerHex,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    color: currentStep.centerColorId === 0 || currentStep.centerColorId === 3 ? '#000000' : '#ffffff',
                    boxShadow: `0 0 10px ${currentStep.centerHex}66`,
                  }}
                >
                  {currentStep.faceKey}
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#F8FAFF' }}>
                    Target: {currentStep.name} ({currentStep.centerName} Center)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {currentStep.instruction}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {currentStep.rotationHint}
              </div>
            </div>

            {/* Live Camera Viewport or Captured Face Review Card */}
            {pendingStickers ? (
              <FaceCaptureCard
                stepInfo={currentStep}
                stickers={pendingStickers}
                onUpdateStickers={handleUpdateStickers}
                onRetake={handleRetake}
                onConfirm={handleConfirmFace}
                isLastFace={totalCompleted === 5}
              />
            ) : (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 'clamp(360px, 60vh, 520px)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: '1px solid rgba(10, 132, 255, 0.28)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                }}
              >
                <CameraFeed
                  onLiveFrame={handleLiveFrame}
                  onQualityUpdate={handleQualityUpdate}
                  calibration={calibrationPrototypes}
                  onCapture={handleCapture}
                  isCapturing={false}
                  disabled={Boolean(pendingStickers)}
                />

                <ScanOverlay
                  stepInfo={currentStep}
                  liveStickers={liveStickers}
                  frameQuality={liveFrameQuality}
                  isScanning={!pendingStickers}
                />
              </div>
            )}

            {/* Fallback to Manual Paint Solver */}
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => navigate('/solver')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textDecoration: 'underline',
                }}
              >
                Prefer manual sticker entry? Switch to 2D Paint Solver
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Ambient Lighting Calibration Modal */}
      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        liveFrameQuality={liveFrameQuality}
        liveCenterColor={liveStickers ? liveStickers[4] : null}
        onApplyCalibration={(prototypes) => setCalibrationPrototypes(prototypes)}
        isCalibrated={Boolean(calibrationPrototypes)}
        onResetCalibration={() => setCalibrationPrototypes(null)}
      />

      {/* Physical Cube Orientation Guide Modal */}
      {showGuide && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(5, 7, 14, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowGuide(false)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#0D1322',
              border: '1px solid rgba(10, 132, 255, 0.3)',
              borderRadius: '24px',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#F8FAFF', letterSpacing: '-0.02em' }}>
                Rubik's Cube Scanning Sequence
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="btn-secondary"
                style={{ padding: '6px 12px', borderRadius: '8px' }}
              >
                Close
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.55', marginBottom: '16px' }}>
              To reconstruct a mathematically valid cube, hold the cube steady and follow the sequential rotation order:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SCAN_STEPS.map((s, idx) => (
                <div
                  key={s.faceKey}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: s.centerHex,
                      color: s.centerColorId === 0 || s.centerColorId === 3 ? '#000000' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#ffffff' }}>
                      {s.name} ({s.centerName} Center)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {s.instruction}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#5AC8FA', marginTop: '4px' }}>
                      Top: {s.topNeighbor.name} | Bottom: {s.bottomNeighbor.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="btn-primary"
              style={{ width: '100%', marginTop: '18px', padding: '12px', borderRadius: '12px', fontSize: '0.9rem' }}
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 130,
            background: 'rgba(5, 7, 14, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '400px',
              width: '100%',
              background: '#0D1322',
              border: '1px solid rgba(255, 59, 48, 0.4)',
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255, 59, 48, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                color: '#FF3B30',
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#F8FAFF', marginBottom: '8px' }}>
              Leave Cube Scanner?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
              You have scanned {totalCompleted} face{totalCompleted > 1 ? 's' : ''}. Leaving now will reset your scan progress.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.85rem' }}
              >
                Stay & Scan
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  navigate('/solver');
                }}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, #FF3B30 0%, #dc2626 100%)',
                  boxShadow: '0 4px 14px rgba(255, 59, 48, 0.35)',
                }}
              >
                Exit Scanner
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
