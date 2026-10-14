import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

const SplashScreen = React.lazy(() => import('./components/SplashScreen'));

// Pages - lazy loaded for optimal initial bundle & fast auth/landing rendering
const Landing = React.lazy(() => import('./pages/Landing'));
const Auth = React.lazy(() => import('./pages/Auth'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Solver = React.lazy(() => import('./pages/Solver'));
const Practice = React.lazy(() => import('./pages/Practice'));
const History = React.lazy(() => import('./pages/History'));
const Statistics = React.lazy(() => import('./pages/Statistics'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Scanner = React.lazy(() => import('./pages/Scanner'));

/** Redirects unauthenticated users to /auth */
function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh' }}>
        <div style={{ color: 'var(--primary-light)', fontWeight: '600' }}>Loading CubeSolve…</div>
      </div>
    );
  }
  return user ? children : <Navigate to="/auth" replace />;
}

/** Layout wrapper that includes the top Navbar & mobile BottomNav */
function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash once per browser session
    return !sessionStorage.getItem('cs_splashed');
  });

  const handleFinishSplash = () => {
    sessionStorage.setItem('cs_splashed', 'true');
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && (
        <React.Suspense fallback={null}>
          <SplashScreen onFinish={handleFinishSplash} />
        </React.Suspense>
      )}

      <React.Suspense fallback={
        <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '12px', background: '#0B1020' }}>
          <div style={{
            width: '36px', height: '36px', border: '3px solid rgba(10,132,255,0.2)',
            borderTopColor: '#0A84FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Loading view…</span>
        </div>
      }>
        <Routes>
          {/* Public */}
          <Route path="/"     element={<AppLayout><Landing /></AppLayout>} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected */}
          <Route path="/dashboard" element={
            <PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>
          } />
          <Route path="/solver" element={
            <PrivateRoute><AppLayout><Solver /></AppLayout></PrivateRoute>
          } />
          <Route path="/scanner" element={
            <PrivateRoute><AppLayout><Scanner /></AppLayout></PrivateRoute>
          } />
          <Route path="/practice" element={
            <PrivateRoute><AppLayout><Practice /></AppLayout></PrivateRoute>
          } />
          <Route path="/history" element={
            <PrivateRoute><AppLayout><History /></AppLayout></PrivateRoute>
          } />
          <Route path="/stats" element={
            <PrivateRoute><AppLayout><Statistics /></AppLayout></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </>
  );
}
