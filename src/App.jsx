import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';

// Pages
import Landing   from './pages/Landing';
import Auth      from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Solver    from './pages/Solver';
import Practice  from './pages/Practice';
import History   from './pages/History';
import Statistics from './pages/Statistics';
import Profile   from './pages/Profile';

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
      {showSplash && <SplashScreen onFinish={handleFinishSplash} />}

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
    </>
  );
}
