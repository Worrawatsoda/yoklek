import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, CheckCircle2, XCircle, Award, Flame, Zap, Star, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../lib/api';

const tk = () => localStorage.getItem('token');

const TYPE_CONFIG = {
  welcome:          { icon: <Star size={18} />,         color: '#9b59b6', bg: 'rgba(155,89,182,0.15)' },
  verify_approved:  { icon: <CheckCircle2 size={18} />, color: '#48bb78', bg: 'rgba(72,187,120,0.12)' },
  verify_rejected:  { icon: <XCircle size={18} />,      color: '#e53e3e', bg: 'rgba(229,62,62,0.12)'  },
  expert_approved:  { icon: <Award size={18} />,        color: '#ed8936', bg: 'rgba(237,137,54,0.12)' },
  expert_rejected:  { icon: <XCircle size={18} />,      color: '#e53e3e', bg: 'rgba(229,62,62,0.12)'  },
  streak_7:         { icon: <Flame size={18} />,        color: '#f6ad55', bg: 'rgba(246,173,85,0.12)' },
  streak_30:        { icon: <Flame size={18} />,        color: '#ed8936', bg: 'rgba(237,137,54,0.12)' },
  streak_100:       { icon: <Flame size={18} />,        color: '#d32f2f', bg: 'rgba(211,47,47,0.15)'  },
  daily_motivation: { icon: <Zap size={18} />,          color: '#1976D2', bg: 'rgba(25,118,210,0.12)' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)   return 'เมื่อกี้';
  if (min < 60)  return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24)   return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 7)   return `${day} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export default function Notification() {
  const navigate = useNavigate();
  const { fetchUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${tk()}` } })
      .then(r => r.json())
      .then(data => { setNotifications(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    const prev = notifications;
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    try {
      const res = await fetch(`${API}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tk()}` },
      });
      if (!res.ok) throw new Error();
      fetchUnreadCount();
    } catch {
      setNotifications(prev);
    }
  };

  const markOneRead = async (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    try {
      const res = await fetch(`${API}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tk()}` },
      });
      if (!res.ok) throw new Error();
      fetchUnreadCount();
    } catch {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: false } : n));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-main)', borderBottom: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.25rem',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', padding: 0 }}>
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Notification</h2>
        <button
          onClick={markAllRead}
          disabled={!notifications.some(n => !n.read)}
          title="อ่านทั้งหมด"
          style={{
            background: 'none', border: 'none', padding: 0, display: 'flex',
            cursor: notifications.some(n => !n.read) ? 'pointer' : 'default',
            color: notifications.some(n => !n.read) ? '#fff' : '#444',
          }}
        >
          <CheckCheck size={20} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', fontSize: '0.9rem' }}>Loading...</p>
        )}

        {!loading && notifications.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <Bell size={48} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.35 }} />
            <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>No notifications yet</p>
            <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0', opacity: 0.6 }}>We'll let you know when something happens</p>
          </div>
        )}

        {notifications.map(n => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.daily_motivation;
          return (
            <div key={n._id}
              onClick={() => !n.read && markOneRead(n._id)}
              style={{
                background: n.read ? '#111' : cfg.bg,
                border: `1px solid ${n.read ? '#1e1e1e' : cfg.color + '44'}`,
                borderRadius: 12, padding: '0.9rem 1rem',
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                transition: 'background 0.2s',
                cursor: n.read ? 'default' : 'pointer',
              }}>
              {/* Icon */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: n.read ? '#1e1e1e' : cfg.bg,
                border: `1px solid ${n.read ? '#333' : cfg.color + '66'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: n.read ? 'var(--text-muted)' : cfg.color,
              }}>
                {cfg.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: n.read ? 400 : 700, color: n.read ? 'var(--text-muted)' : 'var(--text-main)', lineHeight: 1.4 }}>
                  {n.title}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {n.message}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '0.68rem', color: '#444' }}>
                  {timeAgo(n.createdAt)}
                </p>
              </div>

              {/* Unread dot */}
              {!n.read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 4 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
