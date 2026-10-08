import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CubeVisualizer from '../components/CubeVisualizer';
import {
  Lock, User, Mail, ArrowRight, Loader2,
  Eye, EyeOff, CheckCircle2, AlertCircle, Check,
} from 'lucide-react';

// Cube color dot row
function CubeDots() {
  const colors = ['#FF3B30', '#FF9500', '#FFD60A', '#30D158', '#0A84FF', '#BF5AF2'];
  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
      {colors.map((c, i) => (
        <div key={i} style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: c, boxShadow: `0 0 8px ${c}`,
          animation: `particleFloat ${3 + i * 0.5}s ease-in-out infinite`,
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  );
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState({ username: false, email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { login, register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
    setTouched({ username: false, email: false, password: false });
    setAuthSuccess(false);
  }, [isLogin]);

  const isUsernameValid = username.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 6;

  const usernameError = touched.username && !isUsernameValid ? 'Username must be at least 3 characters.' : null;
  const emailError = !isLogin && touched.email && !isEmailValid ? 'Please enter a valid email address.' : null;
  const passwordError = touched.password && !isPasswordValid ? 'Password must be at least 6 characters.' : null;

  if (authLoading) return null;
  if (user && !authSuccess) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ username: true, email: true, password: true });

    if (!isUsernameValid) { triggerError('Please provide a valid username (minimum 3 characters).'); return; }
    if (!isLogin && !isEmailValid) { triggerError('Please provide a valid email address.'); return; }
    if (!isPasswordValid) { triggerError('Password must contain at least 6 characters.'); return; }

    setLoading(true);
    try {
      const res = isLogin
        ? await login(username.trim(), password)
        : await register(username.trim(), email.trim(), password);

      if (res.success) {
        setAuthSuccess(true);
        setSuccessMessage(isLogin ? `Welcome back, ${username.trim()}!` : 'Account created!');
        setTimeout(() => navigate('/dashboard'), 900);
      } else {
        const msg = res.message;
        triggerError(typeof msg === 'object' ? Object.values(msg).join(' ') : msg || 'Authentication failed.');
      }
    } catch {
      triggerError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerError = (msg) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 450);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
      background: '#0B1020',
    }}>

      {/* ── Animated Background Blobs ── */}
      <div className="orb-animate-1" style={{
        position: 'absolute', top: '8%', left: '10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,132,255,0.14) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />
      <div className="orb-animate-2" style={{
        position: 'absolute', bottom: '10%', right: '10%',
        width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(191,90,242,0.12) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div className="orb-animate-3" style={{
        position: 'absolute', top: '45%', right: '20%',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,59,48,0.08) 0%, transparent 70%)',
        filter: 'blur(35px)', pointerEvents: 'none',
      }} />

      {/* Floating color particles */}
      {[
        { color: '#FF3B30', size: 5, top: '18%', left: '12%' },
        { color: '#FF9500', size: 4, top: '72%', left: '8%' },
        { color: '#FFD60A', size: 5, top: '22%', right: '15%' },
        { color: '#30D158', size: 4, top: '78%', right: '12%' },
        { color: '#0A84FF', size: 4, top: '50%', left: '5%' },
        { color: '#BF5AF2', size: 5, top: '60%', right: '5%' },
      ].map((p, i) => (
        <div key={i} className="auth-particle" style={{
          width: `${p.size}px`, height: `${p.size}px`,
          background: p.color, top: p.top, left: p.left, right: p.right,
          boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          animationDelay: `${i * 0.8}s`,
        }} />
      ))}

      {/* ── Main Auth Card ── */}
      <div
        className={`auth-card-enter ${shakeError ? 'auth-shake' : ''}`}
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '28px',
          background: 'rgba(17, 24, 39, 0.82)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 50px rgba(10,132,255,0.1)',
          padding: '0 0 32px 0',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar — cube colors */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #FF3B30, #FF9500, #FFD60A, #30D158, #0A84FF, #BF5AF2)',
          borderRadius: '28px 28px 0 0',
        }} />

        <div style={{ padding: '0 28px' }}>
          {/* 3D Cube */}
          <div style={{
            width: '100%', height: '150px',
            marginTop: '20px', marginBottom: '8px',
            position: 'relative', borderRadius: '18px', overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 60%, rgba(10,132,255,0.08), rgba(11,16,32,0.6))',
          }}>
            <CubeVisualizer height={150} autoRotate={true} enableOrbit={true} enableZoom={false} />
            <div style={{
              position: 'absolute', bottom: '6px', left: 0, right: 0,
              textAlign: 'center', pointerEvents: 'none',
            }}>
              <span style={{
                fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)',
                background: 'rgba(0,0,0,0.5)', padding: '2px 10px', borderRadius: '100px',
              }}>
                Drag to rotate
              </span>
            </div>
          </div>

          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '22px', paddingTop: '8px' }}>
            <CubeDots />
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-0.035em', marginBottom: '6px' }}>
              Cube<span className="text-gradient">Solve</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {isLogin
                ? 'Sign in to access your 3D Rubik\'s solver'
                : 'Join CubeSolve and track your cubing journey'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(11,16,32,0.7)',
            padding: '4px',
            borderRadius: '14px',
            marginBottom: '22px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {[
              { label: 'Sign In', active: isLogin, onClick: () => setIsLogin(true) },
              { label: 'Create Account', active: !isLogin, onClick: () => setIsLogin(false) },
            ].map(({ label, active, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                disabled={loading || authSuccess}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-main)',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  transition: 'all 0.25s var(--ease-smooth)',
                  background: active ? 'linear-gradient(135deg, #0A84FF 0%, #0066cc 100%)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: active ? '0 4px 16px rgba(10,132,255,0.4)' : 'none',
                  minHeight: '40px',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="animate-scale-up" style={{
              background: 'rgba(255,59,48,0.1)',
              border: '1px solid rgba(255,59,48,0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '18px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}>
              <AlertCircle size={17} color="#FF3B30" style={{ flexShrink: 0 }} />
              <span style={{ color: '#ff8080', fontSize: '0.84rem', lineHeight: 1.4 }}>{error}</span>
            </div>
          )}

          {/* Success State */}
          {authSuccess ? (
            <div className="checkmark-animate" style={{
              padding: '36px 16px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(48,209,88,0.15)',
                border: '2px solid rgba(48,209,88,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 0 40px rgba(48,209,88,0.4)',
              }}>
                <CheckCircle2 size={40} color="#30D158" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#30D158', marginBottom: '6px' }}>
                {successMessage}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Opening your dashboard…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Username */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                  <label className="form-label" htmlFor="auth-username" style={{ marginBottom: 0 }}>Username</label>
                  {touched.username && isUsernameValid && (
                    <span style={{ fontSize: '0.73rem', color: '#30D158', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={11} /> Valid
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <User size={17} style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: isUsernameValid ? '#5AC8FA' : 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }} />
                  <input
                    id="auth-username"
                    type="text"
                    className="form-input"
                    style={{
                      paddingLeft: '44px', paddingRight: '38px',
                      borderColor: usernameError ? '#FF3B30' : isUsernameValid && touched.username ? 'rgba(48,209,88,0.5)' : undefined,
                      boxShadow: isUsernameValid && touched.username ? '0 0 0 3px rgba(48,209,88,0.12)' : undefined,
                    }}
                    placeholder="e.g. rubikmaster"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, username: true }))}
                    disabled={loading}
                    required
                    minLength={3}
                    autoComplete="username"
                  />
                  {isUsernameValid && (
                    <CheckCircle2 size={15} color="#30D158" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                </div>
                {usernameError && (
                  <p style={{ color: '#ff6b6b', fontSize: '0.77rem', marginTop: '5px', paddingLeft: '4px' }}>{usernameError}</p>
                )}
              </div>

              {/* Email (register only) */}
              {!isLogin && (
                <div className="form-group animate-fade-in" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                    <label className="form-label" htmlFor="auth-email" style={{ marginBottom: 0 }}>Email Address</label>
                    {touched.email && isEmailValid && (
                      <span style={{ fontSize: '0.73rem', color: '#30D158', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={11} /> Valid
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Mail size={17} style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      color: isEmailValid ? '#5AC8FA' : 'var(--text-muted)',
                      transition: 'color 0.2s',
                    }} />
                    <input
                      id="auth-email"
                      type="email"
                      className="form-input"
                      style={{
                        paddingLeft: '44px', paddingRight: '38px',
                        borderColor: emailError ? '#FF3B30' : isEmailValid && touched.email ? 'rgba(48,209,88,0.5)' : undefined,
                        boxShadow: isEmailValid && touched.email ? '0 0 0 3px rgba(48,209,88,0.12)' : undefined,
                      }}
                      placeholder="alex@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      disabled={loading}
                      required
                      autoComplete="email"
                    />
                    {isEmailValid && (
                      <CheckCircle2 size={15} color="#30D158" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    )}
                  </div>
                  {emailError && (
                    <p style={{ color: '#ff6b6b', fontSize: '0.77rem', marginTop: '5px', paddingLeft: '4px' }}>{emailError}</p>
                  )}
                </div>
              )}

              {/* Password */}
              <div className="form-group" style={{ marginBottom: '26px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <label className="form-label" htmlFor="auth-password" style={{ marginBottom: 0 }}>Password</label>
                  <span style={{ fontSize: '0.72rem', color: isPasswordValid ? '#30D158' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                    {isPasswordValid ? '✓ Strong enough' : 'Min 6 characters'}
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: isPasswordValid ? '#5AC8FA' : 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }} />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{
                      paddingLeft: '44px', paddingRight: '46px',
                      borderColor: passwordError ? '#FF3B30' : isPasswordValid && touched.password ? 'rgba(48,209,88,0.5)' : undefined,
                      boxShadow: isPasswordValid && touched.password ? '0 0 0 3px rgba(48,209,88,0.12)' : undefined,
                    }}
                    placeholder={isLogin ? 'Enter password' : 'Create strong password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                    disabled={loading}
                    required
                    minLength={6}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-secondary)',
                      cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {passwordError && (
                  <p style={{ color: '#ff6b6b', fontSize: '0.77rem', marginTop: '5px', paddingLeft: '4px' }}>{passwordError}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="auth-submit"
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  borderRadius: '14px',
                  padding: '15px 20px',
                  minHeight: '52px',
                  boxShadow: '0 8px 28px rgba(10,132,255,0.45)',
                  background: 'linear-gradient(135deg, #0A84FF 0%, #0066cc 100%)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>{isLogin ? 'Signing In…' : 'Creating Account…'}</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In to CubeSolve' : 'Create Free Account'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link
              to="/"
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              ← Back to CubeSolve Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
