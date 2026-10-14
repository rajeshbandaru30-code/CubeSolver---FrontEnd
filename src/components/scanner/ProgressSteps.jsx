import React from 'react';
import { Check, AlertTriangle, Camera, CheckCircle2 } from 'lucide-react';
import { SCAN_STEPS } from '../../engine/cubeValidatorClient';

/**
 * ProgressSteps
 *
 * Professional 6-face progress component showing:
 * - Not scanned
 * - Currently scanning
 * - Captured and awaiting confirmation
 * - Confirmed
 * - Needs review
 *
 * Fully clickable so users can inspect, jump to, or rescan any face directly.
 */
export default function ProgressSteps({
  currentStepIndex,
  scannedFaces,
  pendingFaceIndex,
  onSelectFace,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '8px',
        width: '100%',
        padding: '4px 0',
      }}
    >
      {SCAN_STEPS.map((step, idx) => {
        const isCurrent = idx === currentStepIndex;
        const isPending = idx === pendingFaceIndex;
        const faceData = scannedFaces[idx];
        const isConfirmed = Boolean(faceData);

        // Check if any sticker on this face was flagged as needsReview and not modified by user
        const hasUncertainStickers = faceData?.some((s) => s.needsReview && s.source !== 'user');

        let statusText = 'Not scanned';
        let borderColor = 'rgba(255, 255, 255, 0.08)';
        let bgStyle = 'rgba(17, 24, 39, 0.5)';
        let glowStyle = 'none';

        if (isConfirmed) {
          if (hasUncertainStickers) {
            statusText = 'Needs review';
            borderColor = 'rgba(255, 149, 0, 0.6)';
            bgStyle = 'rgba(255, 149, 0, 0.12)';
            glowStyle = '0 0 10px rgba(255, 149, 0, 0.25)';
          } else {
            statusText = 'Confirmed';
            borderColor = 'rgba(48, 209, 88, 0.6)';
            bgStyle = 'rgba(48, 209, 88, 0.12)';
            glowStyle = '0 0 10px rgba(48, 209, 88, 0.25)';
          }
        } else if (isPending) {
          statusText = 'Captured';
          borderColor = '#FFD60A';
          bgStyle = 'rgba(255, 214, 10, 0.15)';
          glowStyle = '0 0 12px rgba(255, 214, 10, 0.35)';
        } else if (isCurrent) {
          statusText = 'Scanning';
          borderColor = step.centerHex;
          bgStyle = 'rgba(10, 132, 255, 0.18)';
          glowStyle = `0 0 12px ${step.centerHex}40`;
        }

        return (
          <button
            key={step.faceKey}
            type="button"
            onClick={() => onSelectFace(idx)}
            style={{
              padding: '8px 6px',
              borderRadius: '12px',
              border: `1.5px solid ${borderColor}`,
              background: bgStyle,
              boxShadow: glowStyle,
              color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              position: 'relative',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isCurrent ? 'scale(1.03)' : 'scale(1)',
              outline: 'none',
            }}
            title={`${step.name} (${statusText}) - Click to select`}
            aria-label={`${step.name}: ${statusText}`}
          >
            {/* Top Color Accent Pip & Status Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '3px',
                  background: step.centerHex,
                  boxShadow: `0 0 6px ${step.centerHex}88`,
                }}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: isCurrent ? '#F8FAFF' : 'var(--text-primary)' }}>
                {step.faceKey}
              </span>
            </div>

            {/* Status indicator icon or badge */}
            <div style={{ minHeight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isConfirmed ? (
                hasUncertainStickers ? (
                  <AlertTriangle size={13} color="#FF9500" />
                ) : (
                  <CheckCircle2 size={13} color="#30D158" />
                )
              ) : isPending ? (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFD60A' }} />
              ) : isCurrent ? (
                <Camera size={13} color="#5AC8FA" />
              ) : (
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              )}
            </div>

            {/* Short status label for small screens */}
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: isCurrent ? '700' : '500',
                color: isConfirmed
                  ? hasUncertainStickers ? '#FF9500' : '#30D158'
                  : isCurrent ? '#5AC8FA' : 'var(--text-muted)',
                letterSpacing: '0.02em',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {isConfirmed ? (hasUncertainStickers ? 'Review' : 'Done') : isCurrent ? 'Active' : `Face ${idx + 1}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
