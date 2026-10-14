import React from 'react';

/**
 * ScanOverlay
 *
 * Professional camera overlay for Rubik's Cube scanning:
 * - Subtle dark vignette surrounding the central 3x3 scanning frame
 * - Precision alignment reticle with clean thin lines and corner brackets
 * - Live real-time color dots inside each cell for instant visual feedback
 * - Surrounding orientation reference badges (Top, Bottom, Left, Right neighbors)
 * - Live camera quality & lighting status pill
 */
export default function ScanOverlay({
  stepInfo,
  liveStickers,
  frameQuality,
  isScanning,
}) {
  if (!isScanning) return null;

  const q = frameQuality || {
    status: 'good',
    message: 'Optimal framing',
    badge: 'Ready ✓',
    color: '#30D158',
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
      }}
    >
      {/* Subtle Dark Focus Vignette around the scanning square */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent clamp(120px, 34vw, 160px), rgba(11, 16, 32, 0.72) clamp(170px, 48vw, 240px))',
          pointerEvents: 'none',
        }}
      />

      {/* Top Edge Orientation Badge */}
      {stepInfo?.topNeighbor && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% - clamp(140px, 34vw, 190px) - 38px)',
            background: 'rgba(11, 16, 32, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            padding: '4px 14px',
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '0.74rem',
            fontWeight: '700',
            color: '#F8FAFF',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
            zIndex: 6,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: stepInfo.topNeighbor.hex,
              boxShadow: `0 0 8px ${stepInfo.topNeighbor.hex}`,
            }}
          />
          <span>Top: {stepInfo.topNeighbor.name}</span>
        </div>
      )}

      {/* Live Quality / Lighting Feedback Pill */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(11, 16, 32, 0.85)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${q.color}44`,
          padding: '4px 12px',
          borderRadius: '100px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.74rem',
          fontWeight: '700',
          color: q.color,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 6,
        }}
      >
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: q.color }} />
        <span>{q.badge}</span>
      </div>

      {/* Prominent Target Face & Orientation Banner */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(11, 16, 32, 0.9)',
          backdropFilter: 'blur(10px)',
          border: `1.5px solid ${stepInfo?.centerHex || '#0A84FF'}`,
          padding: '4px 14px',
          borderRadius: '100px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.75rem',
          fontWeight: '800',
          color: '#F8FAFF',
          boxShadow: `0 0 14px ${stepInfo?.centerHex || '#0A84FF'}44`,
          zIndex: 6,
        }}
      >
        <div
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: stepInfo?.centerHex || '#FFFFFF',
            boxShadow: `0 0 8px ${stepInfo?.centerHex || '#FFFFFF'}`,
          }}
        />
        <span>Target: {stepInfo?.name}</span>
      </div>

      {/* Main 3x3 Scanning Box Container */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(240px, 68vw, 320px)',
          height: 'clamp(240px, 68vw, 320px)',
          border: '2px solid rgba(10, 132, 255, 0.45)',
          borderRadius: '18px',
          boxShadow: '0 0 35px rgba(10, 132, 255, 0.25), inset 0 0 25px rgba(10, 132, 255, 0.12)',
        }}
      >
        {/* Corner Reticle Brackets */}
        <div style={{ position: 'absolute', top: '-3px', left: '-3px', width: '22px', height: '22px', borderTop: '4px solid #5AC8FA', borderLeft: '4px solid #5AC8FA', borderRadius: '6px 0 0 0' }} />
        <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '22px', height: '22px', borderTop: '4px solid #5AC8FA', borderRight: '4px solid #5AC8FA', borderRadius: '0 6px 0 0' }} />
        <div style={{ position: 'absolute', bottom: '-3px', left: '-3px', width: '22px', height: '22px', borderBottom: '4px solid #5AC8FA', borderLeft: '4px solid #5AC8FA', borderRadius: '0 0 0 6px' }} />
        <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '22px', height: '22px', borderBottom: '4px solid #5AC8FA', borderRight: '4px solid #5AC8FA', borderRadius: '0 0 6px 0' }} />

        {/* 3x3 Grid of 9 Sticker Cells */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            width: '100%',
            height: '100%',
            padding: '5px',
            gap: '5px',
          }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
            const isCenter = i === 4;
            const liveInfo = liveStickers ? liveStickers[i] : null;
            const detectedHex = liveInfo?.hex;

            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  border: isCenter
                    ? '2px solid rgba(255, 214, 10, 0.85)'
                    : '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '10px',
                  background: isCenter
                    ? 'rgba(255, 214, 10, 0.08)'
                    : 'rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Real-time Color Preview Dot */}
                {detectedHex ? (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: detectedHex,
                      border: '2px solid rgba(0,0,0,0.6)',
                      boxShadow: `0 0 12px ${detectedHex}aa`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.64rem',
                      fontWeight: '800',
                      color: liveInfo?.colorId === 0 || liveInfo?.colorId === 3 ? '#000000' : '#ffffff',
                    }}
                  >
                    {liveInfo?.colorName ? liveInfo.colorName[0] : ''}
                  </div>
                ) : isCenter ? (
                  <div
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: '800',
                      color: '#FFD60A',
                      textAlign: 'center',
                      padding: '2px',
                    }}
                  >
                    CENTER
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Left Edge Orientation Badge */}
      {stepInfo?.leftNeighbor && (
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(11, 16, 32, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            padding: '4px 10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontWeight: '700',
            color: '#F8FAFF',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            zIndex: 6,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: stepInfo.leftNeighbor.hex,
            }}
          />
          <span>{stepInfo.leftNeighbor.name}</span>
        </div>
      )}

      {/* Right Edge Orientation Badge */}
      {stepInfo?.rightNeighbor && (
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(11, 16, 32, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            padding: '4px 10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontWeight: '700',
            color: '#F8FAFF',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            zIndex: 6,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: stepInfo.rightNeighbor.hex,
            }}
          />
          <span>{stepInfo.rightNeighbor.name}</span>
        </div>
      )}

      {/* Bottom Edge Orientation Badge */}
      {stepInfo?.bottomNeighbor && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(50% - clamp(140px, 34vw, 190px) - 38px)',
            background: 'rgba(11, 16, 32, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            padding: '4px 14px',
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '0.74rem',
            fontWeight: '700',
            color: '#F8FAFF',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
            zIndex: 6,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: stepInfo.bottomNeighbor.hex,
              boxShadow: `0 0 8px ${stepInfo.bottomNeighbor.hex}`,
            }}
          />
          <span>Bottom: {stepInfo.bottomNeighbor.name}</span>
        </div>
      )}

      {/* Bottom Guidance Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '100px',
          background: 'rgba(11, 16, 32, 0.82)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          padding: '6px 16px',
          borderRadius: '100px',
          fontSize: '0.76rem',
          color: 'var(--text-secondary)',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 6,
        }}
      >
        Align all 9 stickers inside the square & tap Capture
      </div>
    </div>
  );
}
