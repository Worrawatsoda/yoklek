import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, FileText, ShieldAlert, LogOut, User, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './admin.css';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/expert',    label: 'Expert',    icon: <UserCheck size={18} /> },
  { to: '/admin/user',      label: 'User',      icon: <Users size={18} /> },
  { to: '/admin/content',   label: 'Content',   icon: <FileText size={18} /> },
  { to: '/admin/moderation',label: 'Moderation',icon: <ShieldAlert size={18} /> },
];

function AvatarMenu({ user, onLogout, onGoApp }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const setClose = () => setOpen(false);

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setClose(); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className="adm-avatar"
        onClick={() => setOpen(o => !o)}
        title="Menu"
        style={{ cursor: 'pointer' }}
      >
        {user?.firstName?.charAt(0) || 'A'}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 200,
          background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 10,
          minWidth: 180, padding: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {/* User info */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #252525', marginBottom: 4 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#555' }}>{user?.email}</div>
          </div>

          <MenuItem icon={<Home size={14}/>} label="Go to App" onClick={() => { onGoApp(); setClose(); }} />
          <MenuItem icon={<User size={14}/>} label="Profile" onClick={() => { onGoApp('/profile'); setClose(); }} />
          <div style={{ borderTop: '1px solid #252525', margin: '4px 0' }} />
          <MenuItem icon={<LogOut size={14}/>} label="Log out" onClick={() => { onLogout(); setClose(); }} danger />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '8px 12px', background: 'none', border: 'none',
        borderRadius: 6, color: danger ? '#e53e3e' : '#aaa',
        fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#252525'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {icon} {label}
    </button>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleGoApp  = (path = '/home') => navigate(path);

  return (
    <div className="adm-root">
      {/* Sidebar */}
      <aside className="adm-sidebar">
        <div className="adm-logo">YOKLEK</div>
        <nav className="adm-nav">
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}>
              {icon}
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="adm-main">
        {/* Top bar */}
        <header className="adm-topbar">
          <div />
          <div className="adm-topbar-right">
            <AvatarMenu user={user} onLogout={handleLogout} onGoApp={handleGoApp} />
          </div>
        </header>

        {/* Page content */}
        <div className="adm-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
