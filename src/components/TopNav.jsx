import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function TopNav() {
  const { user, unreadCount } = useAuth();
  const initial = user?.firstName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="top-nav">
      <h1 className="logo" style={{ fontSize: '1.25rem', marginBottom: 0, letterSpacing: '2px', lineHeight: '24px' }}>
        YOKLEK
      </h1>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/notifications" style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <Bell size={24} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: 'var(--accent-red)', color: '#fff',
              borderRadius: '50%', fontSize: '0.6rem', fontWeight: 700,
              minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1, padding: '0 3px',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <Link to="/profile" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="top-nav-avatar">{initial}</div>
        </Link>
      </div>
    </div>
  );
}
