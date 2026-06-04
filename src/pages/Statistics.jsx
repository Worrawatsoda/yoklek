import { useState, useEffect } from 'react';
import {
  Activity, Flame, Weight, Target,
  CheckCircle2, Award, ChevronDown, ChevronUp, Pencil, Check, X, Trash2,
} from 'lucide-react';
import { API } from '../lib/api';
const tk  = () => localStorage.getItem('token');

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function ExImage({ src, alt, size = 44 }) {
  const style = { width: size, height: size, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#333' };
  if (src) {
    return (
      <img src={src} alt={alt || ''} style={style}
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return <div className="history-image-placeholder" style={{ ...style, flexShrink: 0 }} />;
}

function BestPerformance({ bestStats, onGoalSaved }) {
  const [editingId, setEditingId] = useState(null);
  const [goalInput, setGoalInput] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [showAll,   setShowAll]   = useState(false);

  const visible = showAll ? bestStats : bestStats.slice(0, 3);

  const startEdit = (b) => {
    setEditingId(b.exerciseId);
    setGoalInput(b.goalWeight > 0 ? String(b.goalWeight) : '');
  };

  const saveGoal = async (exerciseId) => {
    setSaving(true);
    await fetch(`${API}/auth/exercise-goal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk()}` },
      body: JSON.stringify({ exerciseId, goalWeight: Number(goalInput) || 0 }),
    });
    setSaving(false);
    setEditingId(null);
    onGoalSaved();
  };

  return (
    <div className="history-list-section">
      <div className="section-header" style={{ color: '#fff', marginBottom: '0.75rem' }}>
        <Award size={20} color="#d32f2f" />
        <span>Best Performance</span>
      </div>

      {!bestStats.length ? (
        <p style={{ color: '#444', fontSize: '0.82rem' }}>ยังไม่มีข้อมูล</p>
      ) : (
        <>
        {visible.map((b, i) => {
          const pct = b.goalWeight > 0
            ? Math.min(100, Math.round((b.maxWeight / b.goalWeight) * 100))
            : 0;
          const isEditing = editingId === b.exerciseId;

          return (
            <div key={i} className="history-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: 8 }}>
              {/* Top row: image + info + edit button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ExImage src={b.imageUrl} alt={b.exerciseName} />
                <div className="history-item-info" style={{ flex: 1, minWidth: 0 }}>
                  <span className="history-item-title">{b.exerciseName}</span>
                  <span className="history-item-date">
                    Best: <strong style={{ color: '#fff' }}>{b.maxWeight} kg</strong>
                    {b.goalWeight > 0 && (
                      <span style={{ color: 'var(--text-muted)' }}> / Goal: {b.goalWeight} kg</span>
                    )}
                  </span>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number" min="0" value={goalInput}
                      onChange={e => { if (e.target.value === '' || Number(e.target.value) >= 0) setGoalInput(e.target.value); }}
                      placeholder="goal kg"
                      autoFocus
                      style={{ width: 72, padding: '4px 8px', background: '#1e1e1e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: '0.8rem' }}
                    />
                    <button onClick={() => saveGoal(b.exerciseId)} disabled={saving}
                      style={{ background: 'none', border: 'none', color: '#48bb78', cursor: 'pointer', padding: 4 }}>
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)}
                      style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: 4 }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(b)}
                    style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                    <Pencil size={14} />
                  </button>
                )}
              </div>

              {/* Progress bar — อยู่ใน card, stretch เต็ม width */}
              {b.goalWeight > 0 && (
                <div style={{ paddingLeft: 56 }}>
                  <div style={{ height: 4, background: '#1e1e1e', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4, transition: 'width 0.4s',
                      width: `${pct}%`,
                      background: pct >= 100 ? '#48bb78' : '#c0392b',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontSize: '0.65rem', color: '#555' }}>{pct}%</span>
                    {pct >= 100 && <span style={{ fontSize: '0.65rem', color: '#48bb78' }}>🎯 ถึงเป้าแล้ว!</span>}
                  </div>
                </div>
              )}

              {/* No goal */}
              {!b.goalWeight && !isEditing && (
                <div style={{ paddingLeft: 56 }}>
                  <button onClick={() => startEdit(b)}
                    style={{ background: 'none', border: '1px dashed #333', borderRadius: 6, color: '#555', cursor: 'pointer', padding: '3px 10px', fontSize: '0.72rem' }}>
                    + ตั้งเป้าหมาย
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {bestStats.length > 3 && (
          <button
            onClick={() => setShowAll(v => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', marginTop: '0.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            {showAll
              ? <><ChevronUp size={18} /> Show less</>
              : <><ChevronDown size={18} /> +{bestStats.length - 3} more</>
            }
          </button>
        )}
        </>
      )}
    </div>
  );
}

function Statistics() {
  const [activeTab, setActiveTab] = useState('statistics');

  // stats tab data
  const [stats,         setStats]         = useState(null);
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [showAllBadges, setShowAllBadges] = useState(false);

  // goal days editing
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput,   setGoalInput]   = useState('');
  const [savingGoal,  setSavingGoal]  = useState(false);

  // history tab data
  const [history,        setHistory]        = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expanded,       setExpanded]       = useState({});
  const [deletingId,     setDeletingId]     = useState(null);

  /* ── fetch stats ──────────────────────────────────────── */
  const fetchStats = () => {
    setLoadingStats(true);
    fetch(`${API}/workoutlogs/stats`, { headers: { Authorization: `Bearer ${tk()}` } })
      .then(r => r.json())
      .then(d => { setStats(d); setGoalInput(String(d.goalDays || '')); })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  };

  /* ── fetch history ────────────────────────────────────── */
  const fetchHistory = () => {
    setLoadingHistory(true);
    fetch(`${API}/workoutlogs`, { headers: { Authorization: `Bearer ${tk()}` } })
      .then(r => r.json())
      .then(d => setHistory(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (activeTab === 'history') fetchHistory(); }, [activeTab]);

  /* ── save goal days ───────────────────────────────────── */
  const saveGoal = async () => {
    setSavingGoal(true);
    await fetch(`${API}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk()}` },
      body: JSON.stringify({ goalDays: Number(goalInput) || 0 }),
    });
    setSavingGoal(false);
    setEditingGoal(false);
    fetchStats();
  };

  /* ── toggle history card ──────────────────────────────── */
  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  /* ── delete a workout log ─────────────────────────────── */
  const deleteLog = async (id) => {
    if (!window.confirm('ลบประวัติการออกกำลังกายวันนี้? การลบนี้ย้อนกลับไม่ได้')) return;
    setDeletingId(id);
    const prev = history;
    setHistory(h => h.filter(l => l._id !== id)); // optimistic
    try {
      const res = await fetch(`${API}/workoutlogs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tk()}` },
      });
      if (!res.ok) throw new Error();
      fetchStats(); // อัปเดต streak/PR/total ให้ตรง
    } catch {
      setHistory(prev); // rollback ถ้า fail
      alert('ลบไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── derived ──────────────────────────────────────────── */
  const visibleBadges = stats?.badges
    ? (showAllBadges ? stats.badges : stats.badges.slice(0, 4))
    : [];

  const activeDays = stats?.activeDays  || 0;
  const goalDays   = stats?.goalDays    || 0;
  const daysPct    = goalDays > 0 ? Math.min(100, Math.round((activeDays / goalDays) * 100)) : 0;

  /* ── render ───────────────────────────────────────────── */
  return (
    <div className="statistics-page">
      {/* Tabs */}
      <div className="verify-tabs">
        <button className={`verify-tab ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}>Statistics</button>
        <button className={`verify-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}>History</button>
      </div>

      {/* ── STATISTICS TAB ─────────────────────────────── */}
      {activeTab === 'statistics' && (
        <>
          {loadingStats ? (
            <p style={{ color: '#555', textAlign: 'center', padding: '2rem' }}>Loading...</p>
          ) : (
            <>
              {/* 4 stat boxes */}
              <div className="stats-grid-4">
                <div className="stat-box">
                  <div className="stat-icon-container" style={{ backgroundColor: 'rgba(245,127,23,0.15)' }}>
                    <Activity size={24} color="#FBC02D" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats?.totalWorkouts ?? 0}</span>
                    <span className="stat-label">Total Workouts</span>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon-container" style={{ backgroundColor: 'rgba(211,47,47,0.15)' }}>
                    <Flame size={24} color="#d32f2f" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats?.dayStreak ?? 0}</span>
                    <span className="stat-label">Day Streak</span>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon-container" style={{ backgroundColor: 'rgba(25,118,210,0.15)' }}>
                    <Weight size={24} color="#1976D2" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats?.totalWeight ?? 0}</span>
                    <span className="stat-label">kg Total Volume</span>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon-container" style={{ backgroundColor: 'rgba(56,142,60,0.15)' }}>
                    <Target size={24} color="#4CAF50" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats?.totalSets ?? 0}</span>
                    <span className="stat-label">Total Sets</span>
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="verified-badge-section">
                <div className="section-header" style={{ color: '#fff' }}>
                  <CheckCircle2 size={20} color="#d32f2f" />
                  <span>Verified Badge</span>
                </div>

                {visibleBadges.length === 0 ? (
                  <p style={{ color: '#444', fontSize: '0.82rem', margin: '0.5rem 0' }}>ยังไม่มี badge</p>
                ) : (
                  <div className="badge-grid">
                    {visibleBadges.map((b, i) => (
                      <div key={i} className="badge-card">
                        <div className="badge-card-top">
                          <Award size={18} color="#fff" />
                          <span className="badge-name">{b.exerciseName}</span>
                        </div>
                        <span className="badge-date">{fmtDate(b.earnedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {stats?.badges?.length > 4 && (
                  <button className="expand-btn" onClick={() => setShowAllBadges(v => !v)}>
                    {showAllBadges
                      ? <ChevronUp size={24} />
                      : <><ChevronDown size={24} /><span style={{ fontSize: '0.75rem', color: '#555' }}>+{stats.badges.length - 4} more</span></>
                    }
                  </button>
                )}
              </div>

              {/* Best Performance */}
              <BestPerformance bestStats={stats?.bestStats || []} onGoalSaved={fetchStats} />

              {/* Days Goal */}
              <div className="days-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="days-title">Days Goal</div>
                  {!editingGoal ? (
                    <button onClick={() => setEditingGoal(true)}
                      style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}>
                      <Pencil size={14} />
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number" min="1" value={goalInput}
                        onChange={e => { if (e.target.value === '' || Number(e.target.value) >= 0) setGoalInput(e.target.value); }}
                        placeholder="เป้าหมาย (วัน)"
                        style={{ width: 90, padding: '4px 8px', background: '#1e1e1e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: '0.82rem' }}
                        autoFocus
                      />
                      <button onClick={saveGoal} disabled={savingGoal}
                        style={{ background: 'none', border: 'none', color: '#48bb78', cursor: 'pointer', padding: 4 }}>
                        <Check size={16} />
                      </button>
                      <button onClick={() => { setEditingGoal(false); setGoalInput(String(stats?.goalDays || '')); }}
                        style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: 4 }}>
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="days-progress-header">
                  <span className="days-progress-value">{activeDays}</span>
                  <span className="days-progress-total">/ {goalDays || '?'}</span>
                  {goalDays > 0 && <span className="days-progress-percent">{daysPct}%</span>}
                </div>

                <div className="days-progress-bar-bg">
                  <div className="days-progress-bar-fill" style={{ width: `${daysPct}%` }} />
                </div>

                {goalDays === 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#555', marginTop: 6 }}>
                    กด ✏️ เพื่อตั้งเป้าหมายจำนวนวัน
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── HISTORY TAB ────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="history-tab-list">
          {loadingHistory && (
            <p style={{ color: '#555', textAlign: 'center', padding: '2rem' }}>Loading...</p>
          )}

          {!loadingHistory && history.length === 0 && (
            <p style={{ color: '#444', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>
              ยังไม่มีประวัติการออกกำลังกาย
            </p>
          )}

          {history.map((log) => {
            const isOpen = !!expanded[log._id];
            const exerciseNames = log.exercises.map(e => e.exerciseName).join(', ');
            const totalSets = log.exercises.reduce((s, e) => s + e.sets.length, 0);

            return (
              <div key={log._id} className="history-card-container">
                <div className="history-card-main" onClick={() => toggle(log._id)}>
                  <div className="history-card-left">
                    <div className="history-card-info">
                      <h3 className="history-card-title">{fmtDate(log.date)}</h3>
                      <p className="history-card-date" style={{ fontSize: '0.72rem', color: '#555' }}>
                        {exerciseNames || '-'} · {totalSets} sets
                      </p>
                    </div>
                  </div>
                  <div className="history-card-icon">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isOpen && (
                  <div className="history-details-container">
                    {log.exercises.map((ex, ei) => {
                      const maxW = ex.sets.length > 0
                        ? Math.max(...ex.sets.map(s => s.weight || 0))
                        : 0;
                      return (
                        <div key={ei} style={{ marginBottom: ei < log.exercises.length - 1 ? 16 : 0 }}>
                          {/* Exercise header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #252525', marginBottom: 4 }}>
                            <ExImage src={ex.exerciseId?.imageUrl} alt={ex.exerciseName} size={32} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{ex.exerciseName}</span>
                          </div>
                          {/* Sets */}
                          <div className="history-sets-box">
                            {ex.sets.map((s, si) => (
                              <div key={si} className="history-detail-row">
                                <span>Set {si + 1}</span>
                                <span>{s.weight} kg</span>
                                <span>× {s.reps}</span>
                              </div>
                            ))}
                          </div>
                          {/* Summary */}
                          {(() => {
                            const totalVolume = ex.sets.reduce((sum, s) => sum + (s.reps || 0) * (s.weight || 0), 0);
                            const totalReps   = ex.sets.reduce((sum, s) => sum + (s.reps || 0), 0);
                            const bestSet     = ex.sets.reduce((best, s) =>
                              (s.weight || 0) > (best.weight || 0) ? s : best, ex.sets[0] || {});
                            return (
                              <div style={{ marginTop: 6, background: '#c0392b', borderRadius: 8, padding: '10px 14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>Total Volume</span>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{totalVolume} kg</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>Best Set</span>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                                    {bestSet.weight} kg × {bestSet.reps}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>Total Reps</span>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{totalReps} reps</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}

                    {/* Delete this log */}
                    <button
                      onClick={() => deleteLog(log._id)}
                      disabled={deletingId === log._id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        width: '100%', marginTop: 12, padding: '10px',
                        background: 'transparent', border: '1px solid #5a1e1e',
                        borderRadius: 8, color: '#e53e3e', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 600,
                      }}
                    >
                      <Trash2 size={14} />
                      {deletingId === log._id ? 'กำลังลบ...' : 'ลบประวัตินี้'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Statistics;
