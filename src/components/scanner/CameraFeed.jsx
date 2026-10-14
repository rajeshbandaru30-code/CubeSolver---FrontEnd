import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, SwitchCamera, Zap, ZapOff, AlertCircle, RefreshCw } from 'lucide-react';
import { sampleFaceStickers, analyzeFrameQuality } from '../../engine/colorDetector';

/**
 * CameraFeed
 *
 * Manages the camera stream, device selection, torch toggle, and live
 * frame processing for real-time 3x3 Rubik's Cube sticker detection.
 */
export default function CameraFeed({
  onLiveFrame,
  onCapture,
  onQualityUpdate,
  calibration,
  isCapturing,
  disabled,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) or 'user' (front)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unsupported'
  const [errorMessage, setErrorMessage] = useState(null);
  const [streamReady, setStreamReady] = useState(false);

  // Stop camera tracks cleanly
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setStreamReady(false);
    setTorchOn(false);
  }, []);

  // Check available cameras
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(() => {});
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopTracks();
    setErrorMessage(null);

    // Check secure context / mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isSecure = window.isSecureContext;
      setPermissionState('unsupported');
      setErrorMessage(
        !isSecure
          ? 'Camera access requires a secure context (HTTPS or localhost). Please run on HTTPS or http://localhost.'
          : 'Your browser does not support camera capture via getUserMedia.'
      );
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPermissionState('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Check torch support on the active video track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getCapabilities) {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.torch) {
          setTorchSupported(true);
        }
      }

      setStreamReady(true);
    } catch (err) {
      console.warn('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionState('unsupported');
        setErrorMessage('No camera was detected on this device.');
      } else {
        setPermissionState('denied');
        setErrorMessage(`Unable to access camera: ${err.message || err.name}`);
      }
    }
  }, [facingMode, stopTracks]);

  // Start on mount / restart when facingMode changes
  useEffect(() => {
    startCamera();
    return () => {
      stopTracks();
    };
  }, [startCamera, stopTracks]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({ advanced: [{ torch: nextState }] });
        setTorchOn(nextState);
      } catch (err) {
        console.warn('Could not toggle torch:', err);
      }
    }
  };

  // Flip front / rear camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Live frame processing loop (samples central 3x3 grid at ~15-20 FPS)
  useEffect(() => {
    let lastSampleTime = 0;

    const processFrame = (now) => {
      if (
        streamReady &&
        videoRef.current &&
        canvasRef.current &&
        videoRef.current.readyState >= 2 &&
        !disabled
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Throttle to every ~60ms (approx 16 FPS) to save battery / CPU
        if (now - lastSampleTime > 60) {
          lastSampleTime = now;

          // Match canvas internal resolution to video source resolution
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Calculate central square bounding box (65% of smaller dimension)
          const minDim = Math.min(canvas.width, canvas.height);
          const boxSize = Math.floor(minDim * 0.68);
          const boxX = Math.floor((canvas.width - boxSize) / 2);
          const boxY = Math.floor((canvas.height - boxSize) / 2);

          const liveStickers = sampleFaceStickers(ctx, boxX, boxY, boxSize, calibration);
          const quality = analyzeFrameQuality(ctx, boxX, boxY, boxSize);

          if (onQualityUpdate) {
            onQualityUpdate(quality);
          }

          if (onLiveFrame) {
            onLiveFrame({
              stickers: liveStickers,
              box: { x: boxX, y: boxY, size: boxSize },
              canvasWidth: canvas.width,
              canvasHeight: canvas.height,
              quality,
            });
          }
        }
      }
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [streamReady, disabled, onLiveFrame, onQualityUpdate, calibration]);

  // Capture current frame snapshot
  const handleCaptureClick = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const minDim = Math.min(canvas.width, canvas.height);
    const boxSize = Math.floor(minDim * 0.68);
    const boxX = Math.floor((canvas.width - boxSize) / 2);
    const boxY = Math.floor((canvas.height - boxSize) / 2);

    const detectedStickers = sampleFaceStickers(ctx, boxX, boxY, boxSize, calibration);
    if (onCapture) {
      onCapture(detectedStickers);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#05070e' }}>
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Video element */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: permissionState === 'granted' ? 'block' : 'none',
          transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Error or Permission State Overlay */}
      {permissionState !== 'granted' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px', textAlign: 'center',
          background: 'rgba(11,16,32,0.95)',
          color: '#ffffff',
        }}>
          <AlertCircle size={44} color="#FF3B30" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', fontWeight: '700' }}>
            {permissionState === 'denied' ? 'Camera Permission Required' : 'Camera Unavailable'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '380px', lineHeight: '1.5', marginBottom: '20px' }}>
            {errorMessage || 'CubeSolve needs access to your camera to scan Rubik\'s Cube faces.'}
          </p>

          <button
            onClick={startCamera}
            className="btn-primary"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem',
            }}
          >
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      )}

      {/* Camera Controls Bar (Top Right) */}
      {permissionState === 'granted' && (
        <div style={{
          position: 'absolute', top: '14px', right: '14px',
          display: 'flex', gap: '8px', zIndex: 10,
        }}>
          {torchSupported && (
            <button
              onClick={toggleTorch}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: torchOn ? 'rgba(255,214,10,0.3)' : 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)',
                border: torchOn ? '1px solid #FFD60A' : '1px solid rgba(255,255,255,0.2)',
                color: torchOn ? '#FFD60A' : '#ffffff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title={torchOn ? 'Turn Off Flash' : 'Turn On Flash'}
              aria-label="Toggle camera flashlight"
            >
              {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
            </button>
          )}

          {hasMultipleCameras && (
            <button
              onClick={toggleFacingMode}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title="Switch Front/Rear Camera"
              aria-label="Switch camera direction"
            >
              <SwitchCamera size={18} />
            </button>
          )}
        </div>
      )}

      {/* Main Snap Capture Button (Floating Bottom Center) */}
      {permissionState === 'granted' && !disabled && (
        <div style={{
          position: 'absolute', bottom: '24px', left: 0, right: 0,
          display: 'flex', justifyContent: 'center', zIndex: 10,
        }}>
          <button
            onClick={handleCaptureClick}
            disabled={isCapturing}
            style={{
              width: '74px', height: '74px', borderRadius: '50%',
              background: 'radial-gradient(circle, #ffffff 45%, rgba(255,255,255,0.8) 70%)',
              border: '4px solid rgba(10,132,255,0.8)',
              boxShadow: '0 0 24px rgba(10,132,255,0.6)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: isCapturing ? 'scale(0.92)' : 'scale(1)',
              transition: 'all 0.15s ease',
            }}
            title="Capture Face"
            aria-label="Capture this cube face"
          >
            <div style={{
              width: '54px', height: '54px', borderRadius: '50%',
              background: '#0A84FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff',
            }}>
              <Camera size={26} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
