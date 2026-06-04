import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import Dropdown from './Dropdown';
import { API } from '../../lib/api';
const tk  = () => localStorage.getItem('token');
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }) : '-';
const timeAgo = (d) => {
  if (!d) return '-';
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m || 1} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  return `${Math.floor(h / 24)} day${Math.floor(h/24)>1?'s':''} ago`;
};

/* ── Streak Calendar ─────────────────────────────────── */
function StreakCalendar({ activeDates }) {
  const active = new Set(activeDates);

  // Build 3 months: 2 months ago, last month, this month
  const months = [];
  const today = new Date();
  for (let i = 2; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(d);
  }

  return (
    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto' }}>
      {months.map((monthStart) => {
        const year  = monthStart.getFullYear();
        const month = monthStart.getMonth();
        const name  = monthStart.toLocaleString('en', { month: 'long' });
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDow = (monthStart.getDay() + 6) % 7; // Mon=0

        const cells = [];
        for (let i = 0; i < startDow; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        return (
          <div key={`${year}-${month}`} style={{ minWidth: 180 }}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 6 }}>{name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} style={{ fontSize: '0.6rem', color: '#555', textAlign: 'center', paddingBottom: 3 }}>{d}</div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const hit = active.has(iso);
                return (
                  <div key={i} title={iso} style={{
                    width: 20, height: 20, borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: hit ? '#1a4731' : 'transparent',
                    border: hit ? 'none' : '1px solid #222',
                    fontSize: '0.55rem', color: hit ? '#48bb78' : '#444',
                  }}>
                    {hit ? <CheckCircle2 size={11} /> : day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Detail Panel ────────────────────────────────────── */
function UserDetail({ userId, onClose }) {
  const [data, setData]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API}/admin/users/${userId}/stats`, { headers: { Authorization: `Bearer ${tk()}` } })
      .then(r => r.json())
      .then(d => { setData(d); setForm({
        firstName: d.user.firstName, lastName: d.user.lastName,
        username: d.user.username || '', email: d.user.email,
        birthDate: d.user.birthDate ? d.user.birthDate.slice(0,10) : '',
        gender: d.user.gender || '', weight: d.user.weight || '', height: d.user.height || '',
      }); })
      .catch(() => {});
  }, [userId]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk()}` },
        body: JSON.stringify(form),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'บันทึกไม่สำเร็จ');
      setData(d => ({ ...d, user: updated }));
      setEditing(false);
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  if (!data) return (
    <div className="adm-detail" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#555' }}>Loading...</p>
    </div>
  );

  const { user, activeDates, recentLogs } = data;

  // Group sets by exercise across all logs
  const exerciseMap = {};
  recentLogs.forEach(log => {
    log.exercises.forEach(ex => {
      if (!exerciseMap[ex.exerciseName]) exerciseMap[ex.exerciseName] = { goal: ex.goal, entries: [] };
      ex.sets.forEach(set => {
        exerciseMap[ex.exerciseName].entries.push({ date: log.date, ...set });
      });
    });
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="adm-detail">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="adm-detail-header">
          <div className="adm-detail-avatar">{user.firstName?.charAt(0)}</div>
          <div>
            <div className="adm-detail-name">{user.firstName} {user.lastName}</div>
            <div className="adm-detail-email">@{user.username || user.email.split('@')[0]}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background:'none',border:'none',color:'#555',cursor:'pointer' }}><X size={18}/></button>
      </div>

      {/* Basic Details */}
      <div className="adm-fields-card">
        <h4>Basic Details</h4>
        <div className="adm-fields-grid">
          {editing ? <>
            <EField label="First Name"  value={form.firstName}  onChange={set('firstName')} />
            <EField label="Last Name"   value={form.lastName}   onChange={set('lastName')} />
            <EField label="Username"    value={form.username}   onChange={set('username')} />
            <EField label="Email"       value={form.email}      onChange={set('email')} />
            <EField label="Birth"       value={form.birthDate}  onChange={set('birthDate')} type="date" />
            <EField label="Gender"      value={form.gender}     onChange={set('gender')} isSelect />
            <EField label="Weight (kg)" value={form.weight}     onChange={set('weight')} type="number" />
            <EField label="Height (cm)" value={form.height}     onChange={set('height')} type="number" />
          </> : <>
            <Field label="First Name"  value={user.firstName} />
            <Field label="Last Name"   value={user.lastName} />
            <Field label="Username"    value={user.username || '-'} />
            <Field label="Email"       value={user.email} />
            <Field label="Birth"       value={fmt(user.birthDate)} />
            <Field label="Gender"      value={user.gender || '-'} />
            <Field label="Weight"      value={user.weight ? `${user.weight} kg` : '-'} />
            <Field label="Height"      value={user.height ? `${user.height} cm` : '-'} />
          </>}
        </div>

        {editing ? (
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <button onClick={() => setEditing(false)}
              style={{ flex:1, padding:10, border:'1px solid #444', borderRadius:8, background:'none', color:'#aaa', cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              style={{ flex:1, padding:10, border:'none', borderRadius:8, background:'#c0392b', color:'#fff', fontWeight:700, cursor:'pointer' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            style={{ marginTop:10, width:'100%', padding:10, border:'none', borderRadius:8, background:'#c0392b', color:'#fff', fontWeight:700, fontSize:'0.85rem', cursor:'pointer' }}>
            Edit Profile
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className="adm-fields-card">
        <h4 style={{ fontSize:'0.8rem', color:'#fff', marginBottom:12 }}>Activity</h4>
        <StreakCalendar activeDates={activeDates} />
      </div>

      {/* Exercise Summary Cards */}
      {Object.keys(exerciseMap).length > 0 ? (
        <div className="adm-fields-card">
          <h4 style={{ fontSize:'0.8rem', color:'#fff', marginBottom:12 }}>Exercise Summary</h4>
          {Object.entries(exerciseMap).map(([name, data]) => {
            const maxWeight  = data.entries.length > 0 ? Math.max(...data.entries.map(e => e.weight || 0)) : 0;
            const totalSets  = data.entries.length;
            const totalReps  = data.entries.reduce((s, e) => s + (e.reps || 0), 0);

            // Group entries by date → recent sessions
            const byDate = {};
            data.entries.forEach(e => {
              const d = fmt(e.date);
              if (!byDate[d]) byDate[d] = [];
              byDate[d].push(e);
            });
            const sessions = Object.entries(byDate).slice(0, 3);

            return (
              <div key={name} style={{ background:'#111', borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
                {/* Header */}
                <div style={{ marginBottom:10 }}>
                  <span style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff' }}>{name}</span>
                </div>

                {/* 3 stat pills */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
                  {[
                    { label:'Best', value:`${maxWeight} kg`, color:'#c0392b' },
                    { label:'Sets', value:totalSets, color:'#fff' },
                    { label:'Reps', value:totalReps, color:'#fff' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background:'#1a1a1a', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
                      <div style={{ fontSize:'0.6rem', color:'#555', marginBottom:2 }}>{label}</div>
                      <div style={{ fontSize:'0.88rem', fontWeight:700, color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Recent sessions */}
                {sessions.length > 0 && (
                  <div style={{ borderTop:'1px solid #1e1e1e', paddingTop:8 }}>
                    <span style={{ fontSize:'0.6rem', color:'#555', display:'block', marginBottom:6 }}>Recent sessions</span>
                    {sessions.map(([date, sets]) => {
                      const best     = Math.max(...sets.map(s => s.weight || 0));
                      const repTotal = sets.reduce((s, e) => s + (e.reps || 0), 0);
                      return (
                        <div key={date} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:'1px solid #161616' }}>
                          <span style={{ fontSize:'0.72rem', color:'#666' }}>{date}</span>
                          <span style={{ fontSize:'0.72rem', color:'#888' }}>{sets.length} sets · {repTotal} reps</span>
                          <span style={{ fontSize:'0.72rem', color:'#c0392b', fontWeight:700 }}>{best} kg</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="adm-fields-card">
          <p style={{ color:'#444', fontSize:'0.8rem', textAlign:'center' }}>No workout logs yet</p>
        </div>
      )}
    </div>
  );
}

const ROLE_OPTS = [
  { value: 'user',   label: 'User' },
  { value: 'expert', label: 'Expert' },
  { value: 'admin',  label: 'Admin' },
];
const SORT_OPTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'az',     label: 'Name A → Z' },
  { value: 'za',     label: 'Name Z → A' },
];

/* ── Main Page ───────────────────────────────────────── */
export default function User() {
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [role,   setRole]   = useState('');
  const [sort,   setSort]   = useState('newest');
  const [selected, setSelected] = useState(null);

  const fetchUsers = useCallback((p, q, r, s) => {
    const params = new URLSearchParams({ page: p, limit: 10, sort: s });
    if (q) params.set('search', q);
    if (r) params.set('role', r);
    fetch(`${API}/admin/users?${params}`, { headers: { Authorization: `Bearer ${tk()}` } })
      .then(res => res.json())
      .then(d => { setUsers(d.users || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .catch(() => {});
  }, []); // no deps — all args passed explicitly

  useEffect(() => { fetchUsers(1, search, role, sort); }, [search, role, sort, fetchUsers]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  const goPage = (p) => { if (p < 1 || p > pages) return; setPage(p); fetchUsers(p, search, role, sort); };
  const load = (p = page) => fetchUsers(p, search, role, sort);

  const pageNums = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, '...', pages];
    if (page >= pages - 3) return [1, '...', pages-2, pages-1, pages];
    return [1, '...', page-1, page, page+1, '...', pages];
  };

  return (
    <>
      <h1 className="adm-page-title">User Management</h1>
      <p className="adm-page-sub">overview of the website "YOKLEK"</p>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, maxWidth:320 }}>
          <Search size={14} color="#555" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} />
          <input
            placeholder="search by name"
            value={search}
            onChange={handleSearch}
            style={{ width:'100%', paddingLeft:32, padding:'9px 12px 9px 32px', background:'#1a1a1a', border:'1px solid #252525', borderRadius:8, color:'#fff', fontSize:'0.82rem', outline:'none', boxSizing:'border-box' }}
          />
        </div>
        <Dropdown
          label="Filter"
          icon={<SlidersHorizontal size={13} />}
          options={ROLE_OPTS}
          value={role}
          onChange={v => { setRole(v === role ? '' : v); setPage(1); }}
          minWidth={140}
        />
        <Dropdown
          label="Newest first"
          options={SORT_OPTS}
          value={sort}
          onChange={v => { setSort(v); setPage(1); }}
          minWidth={160}
        />
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap:16, minHeight:400 }}>
        {/* Table */}
        <div className="adm-section-card" style={{ padding:0, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
            <thead>
              <tr style={{ background:'#1e1e1e', borderBottom:'1px solid #252525' }}>
                <th style={{ textAlign:'left', padding:'12px 16px', fontWeight:500, color:'#888' }}>Username</th>
                {!selected && <>
                  <th style={{ textAlign:'center', padding:'12px 8px', fontWeight:500, color:'#888' }}>Badges</th>
                  <th style={{ textAlign:'center', padding:'12px 8px', fontWeight:500, color:'#888' }}>Workouts</th>
                  <th style={{ textAlign:'center', padding:'12px 8px', fontWeight:500, color:'#888' }}>Join Date</th>
                  <th style={{ textAlign:'center', padding:'12px 8px', fontWeight:500, color:'#888' }}>Last Active</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}
                  onClick={() => setSelected(s => s === u._id ? null : u._id)}
                  style={{ borderBottom:'1px solid #1a1a1a', cursor:'pointer', background: selected === u._id ? '#222' : 'transparent', transition:'background 0.1s' }}
                  onMouseEnter={e => { if (selected !== u._id) e.currentTarget.style.background = '#1e1e1e'; }}
                  onMouseLeave={e => { if (selected !== u._id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:6, background:'#333', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.8rem', flexShrink:0 }}>
                        {u.firstName?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ color:'#fff', fontWeight:500 }}>{u.firstName} {u.lastName}</span>
                          {u.role === 'expert' && (
                            <span style={{ fontSize:'0.62rem', padding:'2px 7px', borderRadius:20, background:'#1a4731', color:'#48bb78', fontWeight:700 }}>Expert</span>
                          )}
                          {u.role === 'admin' && (
                            <span style={{ fontSize:'0.62rem', padding:'2px 7px', borderRadius:20, background:'#2d1a3d', color:'#b794f4', fontWeight:700 }}>Admin</span>
                          )}
                        </div>
                        {!selected && <div style={{ fontSize:'0.7rem', color:'#555' }}>{u.email}</div>}
                      </div>
                    </div>
                  </td>
                  {!selected && <>
                    <td style={{ textAlign:'center', padding:'12px 8px' }}>
                      {u.badges?.length > 0
                        ? <span style={{ fontSize:'0.75rem', color:'#48bb78' }}>🏅 {u.badges.length}</span>
                        : <span style={{ color:'#444' }}>—</span>}
                    </td>
                    <td style={{ textAlign:'center', color:'#aaa', padding:'12px 8px' }}>{u.workoutCount}</td>
                    <td style={{ textAlign:'center', color:'#aaa', padding:'12px 8px' }}>{fmt(u.createdAt)}</td>
                    <td style={{ textAlign:'center', color:'#aaa', padding:'12px 8px' }}>{timeAgo(u.lastActive)}</td>
                  </>}
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'#444' }}>No users found</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:4, padding:'14px 16px', borderTop:'1px solid #1a1a1a' }}>
            <PgBtn onClick={() => goPage(page-1)} disabled={page===1}><ChevronLeft size={14}/></PgBtn>
            {pageNums().map((n, i) => (
              n === '...'
                ? <span key={`e${i}`} style={{ padding:'4px 6px', color:'#555', fontSize:'0.8rem' }}>...</span>
                : <PgBtn key={n} active={n===page} onClick={() => goPage(n)}>{n}</PgBtn>
            ))}
            <PgBtn onClick={() => goPage(page+1)} disabled={page===pages}><ChevronRight size={14}/></PgBtn>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="adm-expert-right" style={{ overflow:'hidden' }}>
            <UserDetail userId={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </>
  );
}

/* ── Small helpers ───────────────────────────────────── */
function Field({ label, value }) {
  return (
    <div className="adm-field">
      <label>{label}</label>
      <div className="adm-field-val">{value}</div>
    </div>
  );
}
function EField({ label, value, onChange, type = 'text', isSelect }) {
  return (
    <div className="adm-field">
      <label>{label}</label>
      {isSelect
        ? <select value={value} onChange={onChange} className="adm-field-val" style={{ background:'#1e1e1e', border:'1px solid #333', color:'#fff', borderRadius:6, padding:'6px 10px' }}>
            <option value="">-</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        : <input type={type} value={value} onChange={onChange} className="adm-field-val" style={{ background:'#1e1e1e', border:'1px solid #333', color:'#fff', borderRadius:6, padding:'6px 10px', width:'100%', boxSizing:'border-box' }} />
      }
    </div>
  );
}
function PgBtn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center',
      borderRadius:6, border:'none', cursor: disabled ? 'default' : 'pointer',
      background: active ? '#c0392b' : '#1e1e1e',
      color: disabled ? '#333' : active ? '#fff' : '#888',
      fontSize:'0.8rem', fontWeight: active ? 700 : 400,
    }}>
      {children}
    </button>
  );
}
