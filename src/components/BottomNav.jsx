import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Puzzle, Dumbbell, BarChart2, User } from 'lucide-react';

// Color config per nav item
const NAV_COLORS = {
  '/dashboard': { active: '#5AC8FA', glow: 'rgba(10,132,255,0.3)', bg: 'rgba(10,132,255,0.16)', border: 'rgba(10,132,255,0.35)' },
  '/':          { active: '#5AC8FA', glow: 'rgba(10,132,255,0.3)', bg: 'rgba(10,132,255,0.16)', border: 'rgba(10,132,255,0.35)' },
  '/solver':    { active: '#5AC8FA', glow: 'rgba(10,132,255,0.3)', bg: 'rgba(10,132,255,0.16)', border: 'rgba(10,132,255,0.35)' },
  '/practice':  { active: '#30D158', glow: 'rgba(48,209,88,0.3)',  bg: 'rgba(48,209,88,0.16)',  border: 'rgba(48,209,88,0.35)' },
  '/stats':     { active: '#FF9500', glow: 'rgba(255,149,0,0.3)',  bg: 'rgba(255,149,0,0.16)',  border: 'rgba(255,149,0,0.35)' },
  '/profile':   { active: '#BF5AF2', glow: 'rgba(191,90,242,0.3)', bg: 'rgba(191,90,242,0.16)', border: 'rgba(191,90,242,0.35)' },
  '/auth':      { active: '#BF5AF2', glow: 'rgba(191,90,242,0.3)', bg: 'rgba(191,90,242,0.16)', border: 'rgba(191,90,242,0.35)' },
};

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (location.pathname === '/auth') return null;

  const items = [
    { to: user ? '/dashboard' : '/', label: 'Home',     Icon: LayoutDashboard },
    { to: '/solver',                  label: 'Solve',    Icon: Puzzle },
    { to: '/practice',                label: 'Practice', Icon: Dumbbell },
    { to: '/stats',                   label: 'Stats',    Icon: BarChart2 },
    { to: user ? '/profile' : '/auth', label: 'Profile', Icon: User },
  ];

  return (
    <nav
      className="bottom-nav-bar mobile-only"
      aria-label="Mobile Navigation"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {items.map(({ to, label, Icon }) => {
        const isActive =
          location.pathname === to ||
          (to === '/dashboard' && location.pathname === '/');

        const colors = NAV_COLORS[to] || NAV_COLORS['/dashboard'];

        return (
          <NavLink
            key={to}
            to={to}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            style={{
              color: isActive ? colors.active : 'var(--text-muted)',
            }}
          >
            {/* Active glow dot indicator */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: '2px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '3px',
                borderRadius: '0 0 3px 3px',
                background: colors.active,
                boxShadow: `0 0 8px ${colors.active}`,
              }} />
            )}

            <div
              className="nav-icon-wrapper"
              style={isActive ? {
                background: colors.bg,
                borderColor: colors.border,
                color: colors.active,
                boxShadow: `0 0 14px ${colors.glow}`,
                transform: 'translateY(-2px)',
              } : {}}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ transition: 'all 0.2s ease' }}
              />
            </div>

            <span style={{
              fontSize: '0.62rem',
              fontWeight: isActive ? '700' : '600',
              letterSpacing: '0.05em',
              transition: 'color 0.2s ease',
            }}>
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
