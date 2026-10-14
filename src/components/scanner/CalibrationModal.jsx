import React, { useState, useEffect } from 'react';
import { Sun, CheckCircle2, RotateCcw, AlertCircle, X, Sparkles, Sliders } from 'lucide-react';
import { calibrateLighting } from '../../engine/colorDetector';

/**
 * CalibrationModal
 *
 * Professional ambient color & lighting calibration modal.
 * Guides the user to ensure neutral lighting, provides real-time quality
 * diagnostics, and measures reference white point to normalize color detection.
 */
export default function CalibrationModal({
  isOpen,
  onClose,
  liveFrameQuality,
  liveCenterColor,
  onApplyCalibration,
  isCalibrated,
  onResetCalibration,
}) {
  const [calibratedSuccess, setCalibratedSuccess] = useState(isCalibrated);

  useEffect(() => {
    setCalibratedSuccess(isCalibrated);
  }, [isCalibrated]);

  if (!isOpen) return null;

  const handleCalibrateNow = () => {
    if (liveCenterColor?.rawRgb) {
      const calibratedPrototypes = calibrateLighting(liveCenterColor.rawRgb);
      onApplyCalibration(calibratedPrototypes);
      setCalibratedSuccess(true);
    } else {
      // Default calibration if no camera feed is active yet
      const defaultCalib = calibrateLighting({ r: 245, g: 245, b: 245 });
      onApplyCalibration(defaultCalib);
      setCalibratedSuccess(true);
    }
  };

  const handleReset = () => {
    onResetCalibration();
    setCalibratedSuccess(false);
  };

  const q = liveFrameQuality || {
    status: 'good',
    message: 'Camera feed active',
    badge: 'Ready',
    color: '#30D158',
    brightness: 128,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(5, 7, 14, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '480px',
          width: '100%',
          background: '#0D1322',
          border: '1px solid rgba(10, 132, 255, 0.3)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(10, 132, 255, 0.15)',
                border: '1px solid rgba(10, 132, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5AC8FA',
              }}
            >
              <Sliders size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#F8FAFF', letterSpacing: '-0.02em' }}>
                Lighting & Color Calibration
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
            aria-label="Close Calibration"
          >
            <X size={20} />
          </button>
        </div>

        {/* Short explanation */}
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.55', marginBottom: '16px' }}>
          Every room has different lighting temperatures (warm bulbs, daylight, or fluorescent). Calibrating adapts our CIELAB color engine to your room's ambient spectrum for maximum scanning accuracy.
        </p>

        {/* Lighting Best Practices */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F8FAFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sun size={15} color="#FFD60A" />
            <span>Optimal Lighting Advice:</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
            <div>• Use balanced, diffused ambient room light.</div>
            <div>• Avoid direct camera flash or high-intensity spotlights causing glare.</div>
            <div>• Avoid strongly colored decorative RGB ambient lamps.</div>
          </div>
        </div>

        {/* Live Diagnostics Card */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: `1px solid ${q.color}40`,
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Live Camera Diagnostics:
            </span>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: '700',
                color: q.color,
                background: `${q.color}15`,
                padding: '3px 10px',
                borderRadius: '100px',
                border: `1px solid ${q.color}35`,
              }}
            >
              {q.badge}
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#F8FAFF' }}>
            {q.message}
          </div>

          {/* Sampled Center Patch Preview if available */}
          {liveCenterColor && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: liveCenterColor.hex,
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: `0 0 10px ${liveCenterColor.hex}60`,
                }}
              />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Center patch reading: <strong style={{ color: '#ffffff' }}>{liveCenterColor.colorName}</strong> ({liveCenterColor.confidence}% confidence)
              </span>
            </div>
          )}
        </div>

        {/* Calibration State & Actions */}
        {calibratedSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                background: 'rgba(48, 209, 88, 0.1)',
                border: '1px solid rgba(48, 209, 88, 0.3)',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                color: '#30D158',
                fontWeight: '700',
              }}
            >
              <CheckCircle2 size={18} />
              <span>Calibrated for current ambient lighting ✓</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.85rem' }}
              >
                <RotateCcw size={15} /> Reset to Default
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                style={{ flex: 1.2, padding: '10px', borderRadius: '12px', fontSize: '0.85rem' }}
              >
                Continue Scanning
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={handleCalibrateNow}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '0.92rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0A84FF 0%, #0066cc 100%)',
                boxShadow: '0 4px 16px rgba(10, 132, 255, 0.4)',
              }}
            >
              <Sparkles size={17} /> Calibrate with Current Light
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ width: '100%', padding: '10px', borderRadius: '12px', fontSize: '0.85rem' }}
            >
              Skip (Use Standard Calibration)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
