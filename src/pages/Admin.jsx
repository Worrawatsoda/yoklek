import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Dumbbell, ClipboardCheck, ShieldCheck, CheckCircle2, X, Trash2, ExternalLink, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

import { API as BASE_API } from '../lib/api';
const API = `${BASE_API}/admin`;
const token = () => localStorage.getItem('token');

const roleBg = { admin: '#553c9a', expert: '#276749', user: '#2d3748' };
const statusColor = { pending: '#ed8936', approved: '#48bb78', rejected: '#e53e3e' };

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: '#252525', borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ background: color + '22', borderRadius: 8, padding: 8, color }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, onRefresh }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1.5rem 0 0.75rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
      {onRefresh && (
        <button onClick={onRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <RefreshCw size={16} />
        </button>
      )}
    </div>
  );
}

// ─── Expert Applications ──────────────────────────────────────────────────────
function ExpertAppsSection({ onRefreshStats }) {
  const [apps, setApps] = useState([]);
  const [expanded, setExpanded] = useState({});

  const load = useCallback(() => {
    fetch(`${API}/expert-applications`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => setApps(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, action) => {
    await fetch(`${API}/expert-applications/${id}/${action}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token()}` },
    });
    load(); onRefreshStats();
  };

  const pending = apps.filter(a => a.status === 'pending');
  const others = apps.filter(a => a.status !== 'pending');

  const AppCard = ({ app }) => (
    <div style={{ background: '#252525', borderRadius: 10, padding: '0.875rem', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>
            {app.userId?.firstName} {app.userId?.lastName}
          </p>
          <p style={{ margin: '2px 0 6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.userId?.email}</p>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: statusColor[app.status], textTransform: 'uppercase' }}>
            {app.status}
          </span>
        </div>
        <button onClick={() => setExpanded(e => ({ ...e, [app._id]: !e[app._id] }))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          {expanded[app._id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded[app._id] && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <b style={{ color: 'var(--text-main)' }}>Experience:</b> {app.experience}
          </p>
          {app.certifications && (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <b style={{ color: 'var(--text-main)' }}>Certs:</b> {app.certifications}
            </p>
          )}
          {app.credentialUrl && (
            <a href={app.credentialUrl} target="_blank" rel="noreferrer"
              style={{ color: 'var(--accent-red)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ExternalLink size={13} /> View Credential
            </a>
          )}
          {app.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => act(app._id, 'approve')}
                style={{ flex: 1, padding: '8px', background: '#276749', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                ✓ Approve
              </button>
              <button onClick={() => act(app._id, 'reject')}
                style={{ flex: 1, padding: '8px', background: '#742a2a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                ✗ Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <SectionHeader title={`Expert Applications (${pending.length} pending)`} onRefresh={load} />
      {pending.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending applications</p>}
      {pending.map(a => <AppCard key={a._id} app={a} />)}
      {others.length > 0 && (
        <>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '12px 0 6px' }}>Previous</p>
          {others.map(a => <AppCard key={a._id} app={a} />)}
        </>
      )}
    </>
  );
}

// ─── Users Section ────────────────────────────────────────────────────────────
function UsersSection() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (id, role) => {
    await fetch(`${API}/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ role }),
    });
    load();
  };

  const filtered = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <SectionHeader title={`Users (${users.length})`} onRefresh={load} />
      <input
        placeholder="Search users..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.6rem 1rem', background: '#2a2a2a', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.85rem', marginBottom: 8, boxSizing: 'border-box', outline: 'none' }}
      />
      {filtered.map(u => (
        <div key={u._id} style={{ background: '#252525', borderRadius: 10, padding: '0.75rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
            {u.firstName?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.firstName} {u.lastName}
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
          </div>
          <select
            value={u.role}
            onChange={e => changeRole(u._id, e.target.value)}
            style={{ background: roleBg[u.role], color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
          >
            <option value="user">user</option>
            <option value="expert">expert</option>
            <option value="admin">admin</option>
          </select>
        </div>
      ))}
    </>
  );
}

// ─── Exercises Section ────────────────────────────────────────────────────────
function ExercisesSection() {
  const [exercises, setExercises] = useState([]);

  const load = useCallback(() => {
    fetch(`${API}/exercises`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => setExercises(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleVerified = async (id) => {
    await fetch(`${API}/exercises/${id}/toggle-verified`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token()}` },
    });
    load();
  };

  const deleteEx = async (id) => {
    if (!confirm('Delete this exercise?')) return;
    await fetch(`${API}/exercises/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token()}` },
    });
    load();
  };

  return (
    <>
      <SectionHeader title={`Exercises (${exercises.length})`} onRefresh={load} />
      {exercises.map(ex => (
        <div key={ex._id} style={{ background: '#252525', borderRadius: 10, padding: '0.75rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={ex.imageUrl} alt={ex.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{ex.name}</p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ex.muscleGroup} · {ex.difficulty}</p>
          </div>
          <button onClick={() => toggleVerified(ex._id)}
            style={{ background: ex.verified ? '#276749' : '#2d3748', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={14} color={ex.verified ? '#48bb78' : '#666'} />
            <span style={{ fontSize: '0.72rem', color: ex.verified ? '#48bb78' : '#666' }}>{ex.verified ? 'verified' : 'unverified'}</span>
          </button>
          <button onClick={() => deleteEx(ex._id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#666' }}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </>
  );
}

// ─── Submissions Section ──────────────────────────────────────────────────────
function SubmissionsSection() {
  const [subs, setSubs] = useState([]);

  const load = useCallback(() => {
    fetch(`${API}/submissions`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => setSubs(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <SectionHeader title={`All Submissions (${subs.length})`} onRefresh={load} />
      {subs.map(s => (
        <div key={s._id} style={{ background: '#252525', borderRadius: 10, padding: '0.75rem', marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{s.exerciseId?.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {s.userId?.firstName} {s.userId?.lastName} · {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a href={s.videoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-red)' }}>
                <ExternalLink size={14} />
              </a>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: statusColor[s.status], textTransform: 'uppercase' }}>
                {s.status}
              </span>
            </div>
          </div>
          {s.feedback && <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Feedback: {s.feedback}</p>}
        </div>
      ))}
    </>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
const SECTIONS = ['Overview', 'Expert Apps', 'Users', 'Exercises', 'Submissions'];

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('Overview');
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(() => {
    fetch(`${API}/stats`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/home'); return; }
    loadStats();
  }, [user, navigate, loadStats]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Top bar */}
      <div style={{ background: '#1a1a1a', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>YOKLEK <span style={{ color: 'var(--accent-red)' }}>ADMIN</span></h1>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Welcome, {user.firstName}</p>
        </div>
        <button onClick={() => navigate('/home')}
          style={{ background: '#2a2a2a', border: 'none', borderRadius: 8, padding: '6px 14px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
          ← Back to App
        </button>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '0.75rem 1rem', overflowX: 'auto', background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.82rem', fontWeight: 600,
              background: activeSection === s ? 'var(--accent-red)' : '#2a2a2a',
              color: activeSection === s ? '#fff' : 'var(--text-muted)' }}>
            {s}
            {s === 'Expert Apps' && stats?.pendingExperts > 0 && (
              <span style={{ marginLeft: 6, background: '#e53e3e', borderRadius: '50%', padding: '1px 6px', fontSize: '0.7rem', color: '#fff' }}>{stats.pendingExperts}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '1rem 1.25rem', maxWidth: 600, margin: '0 auto' }}>

        {activeSection === 'Overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
              <StatCard icon={<Users size={20} />} label="Total Users" value={stats?.users ?? '—'} color="#4299e1" />
              <StatCard icon={<Dumbbell size={20} />} label="Exercises" value={stats?.exercises ?? '—'} color="#48bb78" />
              <StatCard icon={<ClipboardCheck size={20} />} label="Pending Reviews" value={stats?.pendingSubmissions ?? '—'} color="#ed8936" />
              <StatCard icon={<ShieldCheck size={20} />} label="Pending Experts" value={stats?.pendingExperts ?? '—'} color="#9f7aea" />
            </div>
            <button onClick={loadStats} style={{ width: '100%', padding: '10px', background: '#2a2a2a', border: 'none', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <RefreshCw size={14} /> Refresh Stats
            </button>
          </>
        )}

        {activeSection === 'Expert Apps' && <ExpertAppsSection onRefreshStats={loadStats} />}
        {activeSection === 'Users' && <UsersSection />}
        {activeSection === 'Exercises' && <ExercisesSection />}
        {activeSection === 'Submissions' && <SubmissionsSection />}
      </div>
    </div>
  );
}
