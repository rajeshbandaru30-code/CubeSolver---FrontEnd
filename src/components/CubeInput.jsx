import React, { useState } from 'react';
import { Lock, Palette } from 'lucide-react';

// Color palette for the input net
const COLORS = [
  { value: 0, char: 'U', hex: '#FFFFFF', name: 'White',  border: '#cbd5e1' },
  { value: 1, char: 'R', hex: '#EF4444', name: 'Red',    border: '#dc2626' },
  { value: 2, char: 'F', hex: '#22C55E', name: 'Green',  border: '#16a34a' },
  { value: 3, char: 'D', hex: '#FACC15', name: 'Yellow', border: '#ca8a04' },
  { value: 4, char: 'L', hex: '#F97316', name: 'Orange', border: '#ea580c' },
  { value: 5, char: 'B', hex: '#3B82F6', name: 'Blue',   border: '#2563eb' },
];

const FACE_CONFIG = [
  { face: 0, name: 'Up',    offset: 0,  label: 'U' },
  { face: 4, name: 'Left',  offset: 36, label: 'L' },
  { face: 2, name: 'Front', offset: 18, label: 'F' },
  { face: 1, name: 'Right', offset: 9,  label: 'R' },
  { face: 5, name: 'Back',  offset: 45, label: 'B' },
  { face: 3, name: 'Down',  offset: 27, label: 'D' },
];

export default function CubeInput({ facelets, setFacelets, disabled }) {
  const [selectedColor, setSelectedColor] = useState(0);

  // Handle clicking a sticker
  const handleStickerClick = (index) => {
    if (disabled) return;
    // Don't allow changing centers (indices 4, 13, 22, 31, 40, 49)
    if ([4, 13, 22, 31, 40, 49].includes(index)) return;

    const newFacelets = [...facelets];
    newFacelets[index] = selectedColor;
    setFacelets(newFacelets);
  };

  const renderFace = (faceIndex, offset, label) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2px',
            background: '#090d16',
            padding: '3px',
            borderRadius: '6px',
            width: 'clamp(62px, 18vw, 84px)',
            height: 'clamp(62px, 18vw, 84px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
            const globalIdx = offset + i;
            const colorVal = facelets[globalIdx];
            const faceDefault = COLORS.find(c => c.value === Math.floor(offset / 9))?.hex || '#FFFFFF';
            const colorHex = COLORS.find(c => c.value === colorVal)?.hex || faceDefault;
            const isCenter = i === 4;

            return (
              <div
                key={globalIdx}
                onClick={() => handleStickerClick(globalIdx)}
                title={isCenter ? 'Fixed Center Sticker' : 'Click to Paint'}
                style={{
                  background: colorHex,
                  width: '100%',
                  height: '100%',
                  borderRadius: '2px',
                  cursor: isCenter || disabled ? 'not-allowed' : 'pointer',
                  border: '1px solid rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'transform 0.1s ease',
                }}
              >
                {isCenter && (
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(0,0,0,0.35)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>

      {/* Color Palette Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '8px 16px',
          borderRadius: '100px',
          border: '1px solid var(--surface-border)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Palette size={14} color="var(--primary-color)" /> Paint:
        </span>
        {COLORS.map((color) => {
          const isSelected = selectedColor === color.value;
          return (
            <button
              key={color.value}
              onClick={() => setSelectedColor(color.value)}
              disabled={disabled}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: color.hex,
                border: isSelected ? '3px solid #ffffff' : `2px solid ${color.border}`,
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: isSelected ? '0 0 14px rgba(255,255,255,0.7)' : 'none',
                transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s ease',
              }}
              title={`${color.name} (Key ${color.value + 1})`}
              aria-label={`Select ${color.name} paint`}
            />
          );
        })}
      </div>

      {/* 2D Unfolded Net Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, clamp(62px, 18vw, 84px))',
          gridTemplateRows: 'repeat(3, auto)',
          gap: 'clamp(6px, 1.5vw, 12px)',
          justifyContent: 'center',
        }}
      >
        {/* Row 1: Up face */}
        <div />
        {renderFace(0, 0, 'Up (W)')}
        <div />
        <div />

        {/* Row 2: Left, Front, Right, Back */}
        {renderFace(4, 36, 'Left (O)')}
        {renderFace(2, 18, 'Front (G)')}
        {renderFace(1, 9,  'Right (R)')}
        {renderFace(5, 45, 'Back (B)')}

        {/* Row 3: Down face */}
        <div />
        {renderFace(3, 27, 'Down (Y)')}
        <div />
        <div />
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '360px', lineHeight: '1.4' }}>
        Select a color from the palette, then click any outer sticker to paint. Center stickers remain fixed to preserve cube orientation.
      </div>
    </div>
  );
}
