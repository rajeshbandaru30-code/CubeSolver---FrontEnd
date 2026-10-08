import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Puzzle, Dumbbell,
  History, BarChart2, LogOut, User, LogIn,
} from 'lucide-react';

const DESKTOP_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',  Icon: LayoutDashboard, color: '#5AC8FA' },
  { to: '/solver',    label: 'Solve Cube', Icon: Puzzle,          color: '#5AC8FA' },
  { to: '/practice',  label: 'Practice',   Icon: Dumbbell,        color: '#30D158' },
  { to: '/history',   label: 'History',    Icon: History,         color: '#BF5AF2' },
  { to: '/stats',     label: 'Statistics', Icon: BarChart2,       color: '#FF9500' },
];

// Cube sticker icon (6 colored squares)
function CubeIcon() {
  const colors = ['#FF3B30', '#FF9500', '#FFD60A', '#30D158', '#0A84FF', '#BF5AF2'];
  return (
    <div style={{
      width: '22px',
      height: '22px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(2, 1fr)',
      gap: '1.5px',
    }}>
      {colors.map((c, i) => (
        <div key={i} style={{
          borderRadius: '2px',
          background: c,
          boxShadow: `0 0 4px ${c}66`,
        }} />
      ))}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="container flex-between" style={{ width: '100%' }}>

        {/* Brand Logo */}
        <NavLink
          to={user ? '/dashboard' : '/'}
          className="logo"
          style={{ textDecoration: 'none', gap: '10px' }}
        >
          <div className="logo-badge">
            <CubeIcon />
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '-0.03em' }}>
            Cube<span className="text-gradient">Solve</span>
          </span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {DESKTOP_NAV_ITEMS.map(({ to, label, Icon, color }) => {
            const isActive = location.pathname === to ||
              (to === '/dashboard' && location.pathname === '/');
            return (
              <NavLink
                key={to}
                to={to}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? '700' : '500',
                  textDecoration: 'none',
                  transition: 'all 0.18s ease',
                  color: isActive ? color : 'var(--text-secondary)',
                  background: isActive ? `${color}14` : 'transparent',
                  border: isActive ? `1px solid ${color}30` : '1px solid transparent',
                  boxShadow: isActive ? `0 0 12px ${color}20` : 'none',
                }}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop User Section */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user ? (
            <>
              <NavLink
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px 5px 5px',
                  borderRadius: '100px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(191,90,242,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <User size={14} color="#fff" />
                </div>
                <span style={{ fontWeight: '600', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </span>
              </NavLink>

              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.84rem',
                  minHeight: '36px',
                  borderRadius: '10px',
                  color: 'rgba(255,100,100,0.9)',
                  borderColor: 'rgba(255,59,48,0.2)',
                }}
                title="Sign out"
              >
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth?mode=login')}
                className="btn-secondary"
                style={{ padding: '7px 16px', fontSize: '0.88rem', minHeight: '36px', borderRadius: '10px' }}
              >
                <LogIn size={14} /> Sign In
              </button>
              <button
                onClick={() => navigate('/auth?mode=register')}
                className="btn-primary"
                style={{ padding: '7px 18px', fontSize: '0.88rem', minHeight: '36px', borderRadius: '10px' }}
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile Header Right */}
        <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <NavLink
              to="/profile"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid rgba(10,132,255,0.4)',
                boxShadow: '0 0 12px rgba(10,132,255,0.3)',
                textDecoration: 'none',
              }}
              title="My Profile"
            >
              <User size={16} color="#fff" />
            </NavLink>
          ) : (
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.82rem', minHeight: '34px', borderRadius: '10px' }}
            >
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
