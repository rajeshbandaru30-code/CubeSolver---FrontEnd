import React, { useState } from 'react';
import { Check, RotateCcw, RotateCw, AlertTriangle, Palette, UserCheck, Sparkles, ChevronRight } from 'lucide-react';
import { CUBE_COLORS } from '../../engine/colorDetector';
import { rotateGrid90 } from '../../engine/orientationGuide';

/**
 * FaceCaptureCard
 *
 * Professional post-capture sticker review card:
 * - 3x3 interactive sticker grid with distinct warning badges for uncertain colors
 * - Clear distinction between predicted vs. user-confirmed stickers
 * - Touch-friendly 6-color palette with accessible text labels
 * - Center sticker validation warning if physical cube orientation was incorrect
 * - Actions: Retake face or Confirm face & proceed
 */
export default function FaceCaptureCard({
  stepInfo,
  stickers,
  onUpdateStickers,
  onRetake,
  onConfirm,
  isLastFace,
}) {
  const [editingIndex, setEditingIndex] = useState(null);

  const centerSticker = stickers && stickers[4];
  const centerMismatch = centerSticker && centerSticker.colorId !== stepInfo.centerColorId;

  // Count uncertain stickers
  const uncertainCount = stickers ? stickers.filter((s) => s.needsReview && s.source !== 'user').length : 0;

  // Handle user selecting a new color for a sticker
  const handleSelectColor = (stickerIndex, colorId) => {
    const selected = CUBE_COLORS.find((c) => c.id === colorId);
    if (!selected) return;

    const updated = stickers.map((s, idx) => {
      if (idx === stickerIndex) {
        return {
          ...s,
          colorId: selected.id,
          colorName: selected.name,
          hex: selected.hex,
          confidence: 100,
          needsReview: false,
          source: 'user', // Marked as user confirmed
        };
      }
      return s;
    });

    onUpdateStickers(updated);
    setEditingIndex(null);
  };

  // Rotate face stickers 90° CW or CCW if user scanned physical cube tilted
  const handleRotateGrid = (dir) => {
    const rotated = rotateGrid90(stickers, dir);
    onUpdateStickers(rotated);
    setEditingIndex(null);
  };

  const activeSticker = editingIndex !== null ? stickers[editingIndex] : null;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        borderRadius: '24px',
        background: 'rgba(17, 24, 39, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(10, 132, 255, 0.28)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '440px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: stepInfo.centerHex,
                boxShadow: `0 0 8px ${stepInfo.centerHex}88`,
              }}
            />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#F8FAFF', letterSpacing: '-0.02em' }}>
              Review Scanned Face: <span style={{ color: stepInfo.centerHex }}>{stepInfo.name}</span>
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {uncertainCount > 0
              ? `${uncertainCount} sticker${uncertainCount > 1 ? 's' : ''} flagged for review. Tap to adjust.`
              : 'All 9 colors identified with high confidence. Tap any sticker to change.'}
          </p>
        </div>
      </div>

      {/* Center Mismatch Alert */}
      {centerMismatch && (
        <div
          style={{
            background: 'rgba(255, 149, 0, 0.12)',
            border: '1px solid rgba(255, 149, 0, 0.4)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.78rem',
            color: '#FFD60A',
          }}
        >
          <AlertTriangle size={18} color="#FFD60A" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Center Mismatch:</strong>
            <p style={{ marginTop: '2px', color: '#fef3c7', lineHeight: '1.4' }}>
              Detected center is <strong>{centerSticker?.colorName}</strong>, but this face requires <strong>{stepInfo.centerName}</strong>. If your cube orientation was off, please retake this face or tap center to correct.
            </p>
          </div>
        </div>
      )}

      {/* 3x3 Grid Display */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '8px',
          width: 'clamp(210px, 55vw, 240px)',
          height: 'clamp(210px, 55vw, 240px)',
          margin: '0 auto',
          background: '#090D16',
          padding: '8px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
        }}
      >
        {stickers.map((s, idx) => {
          const isCenter = idx === 4;
          const isEditing = editingIndex === idx;
          const isUserConfirmed = s.source === 'user';
          const isUncertain = s.needsReview && !isUserConfirmed;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setEditingIndex(isEditing ? null : idx)}
              style={{
                position: 'relative',
                background: s.hex,
                borderRadius: '8px',
                border: isEditing
                  ? '3px solid #5AC8FA'
                  : isUncertain
                  ? '2.5px dashed #FF9500'
                  : isUserConfirmed
                  ? '2px solid rgba(48, 209, 88, 0.8)'
                  : '1px solid rgba(0, 0, 0, 0.35)',
                boxShadow: isEditing
                  ? '0 0 14px #5AC8FA'
                  : isUncertain
                  ? '0 0 10px rgba(255, 149, 0, 0.45)'
                  : 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: s.colorId === 0 || s.colorId === 3 ? '#000000' : '#ffffff',
                fontWeight: '900',
                fontSize: '0.82rem',
                transition: 'all 0.15s ease',
                padding: 0,
                outline: 'none',
              }}
              title={
                isUserConfirmed
                  ? `${s.colorName} (User Confirmed)`
                  : isUncertain
                  ? `${s.colorName} (${s.confidence}% conf - Needs Review)`
                  : `${s.colorName} (${s.confidence}% conf)`
              }
              aria-label={`Sticker ${idx + 1}: ${s.colorName}`}
            >
              <span>{s.colorName ? s.colorName[0] : '?'}</span>

              {/* Needs Review Badge */}
              {isUncertain && (
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    right: '3px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#FF9500',
                    boxShadow: '0 0 6px #FF9500',
                  }}
                />
              )}

              {/* User Confirmed Checkmark Indicator */}
              {isUserConfirmed && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#30D158',
                  }}
                />
              )}

              {/* Center Dot Indicator */}
              {isCenter && (
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.45)',
                    marginTop: '2px',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 90° Facelet Orientation Adjustment Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '6px 10px',
        }}
      >
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
          Orient Face:
        </span>

        <button
          type="button"
          onClick={() => handleRotateGrid('CCW')}
          className="btn-secondary"
          style={{
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Rotate Face 90° Counter-Clockwise"
        >
          <RotateCcw size={12} /> 90° CCW
        </button>

        <button
          type="button"
          onClick={() => handleRotateGrid('CW')}
          className="btn-secondary"
          style={{
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Rotate Face 90° Clockwise"
        >
          <RotateCw size={12} /> 90° CW
        </button>
      </div>

      {/* Quick Color Palette with Accessible Labels (Appears when sticker is tapped) */}
      {editingIndex !== null && activeSticker && (
        <div
          className="animate-fade-in"
          style={{
            background: 'rgba(9, 13, 22, 0.95)',
            border: '1px solid rgba(10, 132, 255, 0.35)',
            borderRadius: '16px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#5AC8FA', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Palette size={14} /> Sticker #{editingIndex + 1} Color:
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Current: {activeSticker.colorName} ({activeSticker.source === 'user' ? 'Confirmed' : `${activeSticker.confidence}% conf`})
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            {CUBE_COLORS.map((c) => {
              const isSelected = activeSticker.colorId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectColor(editingIndex, c.id)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? '1.5px solid #5AC8FA' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 10px rgba(10, 132, 255, 0.3)' : 'none',
                  }}
                  aria-label={`Assign color ${c.label}`}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: c.hex,
                      border: `1px solid ${c.border}`,
                      boxShadow: `0 0 6px ${c.hex}66`,
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', fontWeight: '700', color: isSelected ? '#5AC8FA' : '#F8FAFF' }}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons: Retake & Confirm */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={onRetake}
          className="btn-secondary"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            padding: '12px',
            borderRadius: '14px',
            fontSize: '0.88rem',
            fontWeight: '700',
          }}
        >
          <RotateCcw size={16} /> Retake Face
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className="btn-primary"
          style={{
            flex: 1.4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            padding: '12px',
            borderRadius: '14px',
            fontSize: '0.88rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #30D158 0%, #25a244 100%)',
            boxShadow: '0 6px 20px rgba(48, 209, 88, 0.35)',
          }}
        >
          <Check size={16} /> {isLastFace ? 'Review Complete Cube' : 'Confirm Face & Next'}
        </button>
      </div>
    </div>
  );
}
