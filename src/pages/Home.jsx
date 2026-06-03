import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Award, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { API } from '../lib/api';
const tk  = () => localStorage.getItem('token');

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/* ── local ISO "YYYY-MM-DD" (ไม่ใช้ UTC เพื่อหลีกเลี่ยง timezone shift) */
const localISO = (d) => [
  d.getFullYear(),
  String(d.getMonth() + 1).padStart(2, '0'),
  String(d.getDate()).padStart(2, '0'),
].join('-');

/* ── build Mon-Sun of current week ──────────────────────── */
function buildWeek(workoutDates) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dow   = today.getDay(); // 0=Sun
  const diff  = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today); monday.setDate(today.getDate() - diff);

  const dateSet = new Set(workoutDates);
  const labels  = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return {
      label:    labels[i],
      date:     d.getDate(),
      isToday:  d.getTime() === today.getTime(),
      isFuture: d > today,
      checked:  dateSet.has(localISO(d)),
    };
  });
}

function Home() {
  const navigate = useNavigate();
  const [stats,       setStats]       = useState(null);
  const [weekDays,    setWeekDays]    = useState([]);
  const [showAllPR,   setShowAllPR]   = useState(false);
  const [showAllBadge,setShowAllBadge]= useState(false);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/workoutlogs/stats`, { headers: { Authorization: `Bearer ${tk()}` } }).then(r => r.json()),
      fetch(`${API}/workoutlogs`,       { headers: { Authorization: `Bearer ${tk()}` } }).then(r => r.json()),
    ]).then(([s, logs]) => {
      setStats(s);
      const dates = Array.isArray(logs)
        ? logs.map(l => localISO(new Date(l.date)))
        : [];
      setWeekDays(buildWeek(dates));
    }).catch(() => {
      setWeekDays(buildWeek([]));
    }).finally(() => setLoading(false));
  }, []);

  /* ── derived ──────────────────────────────────────────── */
  const prList    = (stats?.bestStats || []).filter(b => b.goalWeight > 0);
  const visiblePR = showAllPR ? prList : prList.slice(0, 1);

  const badges       = stats?.badges || [];
  const visibleBadge = showAllBadge ? badges : badges.slice(0, 2);

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#555' }}>Loading...</div>
  );

  return (
    <div>
      {/* Streak */}
      <div className="streak-container" style={{ marginTop: '1rem' }}>
        <div className="streak-badge">
          <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px rgba(255,100,0,0.8))' }}>🔥</span>
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
          {stats?.dayStreak ?? 0} day{stats?.dayStreak !== 1 ? 's' : ''} streak
        </h2>
      </div>

      {/* Weekly Calendar */}
      <div className="weekly-cal">
        {weekDays.map((d, i) => (
          <div key={i} className={`cal-day ${d.isToday ? 'active' : ''}`}>
            <span style={{ fontWeight: 600 }}>{d.label}</span>
            {d.checked ? (
              <CheckCircle2 size={20} color="var(--text-main)" />
            ) : (
              <span style={{
                fontWeight: d.isToday ? 700 : 400,
                color: d.isToday ? 'var(--accent-red)' : d.isFuture ? '#444' : 'var(--text-muted)',
              }}>
                {d.date}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Stats Card */}
      <div className="stats-card">
        <span className="stats-header">Your stats</span>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Workouts</span>
            <span className="stat-value">{stats?.totalWorkouts ?? 0}</span>
          </div>
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <div className="stat-item">
            <span className="stat-label">Total Sets</span>
            <span className="stat-value">{stats?.totalSets ?? 0}</span>
          </div>
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <div className="stat-item">
            <span className="stat-label">Streak</span>
            <span className="stat-value">{stats?.dayStreak ?? 0}</span>
          </div>
        </div>
      </div>

      {/* PR Card */}
      <div className="pr-card">
        <div className="pr-title">
          <span>Personal Record (PR)</span>
          <button
            onClick={() => navigate('/statistics')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <Settings size={16} />
          </button>
        </div>

        {prList.length === 0 ? (
          <p style={{ color: '#555', fontSize: '0.82rem', marginTop: '0.75rem' }}>
            ยังไม่มี PR — ตั้ง goal ใน Statistics ก่อน
          </p>
        ) : (
          <>
            {visiblePR.map((pr, i) => {
              const pct = Math.min(100, Math.round((pr.maxWeight / pr.goalWeight) * 100));
              return (
                <div key={i} style={{ marginTop: i === 0 ? '1rem' : '1.25rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pr.exerciseName}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.4rem' }}>
                    <div>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{pr.maxWeight}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                        / {pr.goalWeight} kg
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: pct >= 100 ? '#48bb78' : 'var(--text-muted)' }}>
                      {pct >= 100 ? '🎯 Goal!' : `${pct}%`}
                    </span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? '#48bb78' : undefined,
                    }} />
                  </div>
                </div>
              );
            })}

            {prList.length > 1 && (
              <button
                onClick={() => setShowAllPR(v => !v)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showAllPR ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </>
        )}
      </div>

      {/* Verified Card */}
      <div className="pr-card">
        <div className="pr-title">
          <span>Verified</span>
        </div>

        {badges.length === 0 ? (
          <p style={{ color: '#555', fontSize: '0.82rem', marginTop: '0.5rem' }}>
            ยังไม่มี badge — ส่ง verify ท่าออกกำลังกายก่อน
          </p>
        ) : (
          <>
            <div className="mini-card-container" style={{ marginTop: '0.75rem' }}>
              {visibleBadge.map((b, i) => (
                <div key={i} className="mini-card">
                  <Award size={20} color="var(--text-muted)" />
                  <div className="mini-card-info">
                    <span className="mini-card-title">{b.exerciseName}</span>
                    <span className="mini-card-date">{fmtDate(b.earnedAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            {badges.length > 2 && (
              <button
                onClick={() => setShowAllBadge(v => !v)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showAllBadge
                  ? <ChevronUp size={20} />
                  : <><ChevronDown size={20} /><span style={{ fontSize: '0.72rem', marginLeft: 4 }}>+{badges.length - 2} more</span></>
                }
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
