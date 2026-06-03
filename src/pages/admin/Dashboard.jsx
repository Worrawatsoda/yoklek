import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { API } from '../../lib/api';
const token = () => localStorage.getItem('token');

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, exercises: 0, pendingSubmissions: 0, pendingExperts: 0, totalExperts: 0 });
  const [recentApps, setRecentApps] = useState([]);

  useEffect(() => {
    fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(setStats).catch(() => {});

    fetch(`${API}/admin/expert-applications`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(data => setRecentApps(Array.isArray(data) ? data.filter(a => a.status === 'pending').slice(0, 5) : []))
      .catch(() => {});
  }, []);

  return (
    <>
      <h1 className="adm-page-title">Dashboard</h1>
      <p className="adm-page-sub">overview of the website "YOKLEK"</p>

      {/* Stats */}
      <div className="adm-stats">
        <StatCard label="Total Users"              value={stats.users}            sub="+0% from last month" />
        <StatCard label="Total Exercises"          value={stats.exercises}        sub="exercises in system" />
        <StatCard label="Total Expert"             value={stats.totalExperts}     sub="users with expert role" />
        <StatCard label="Pending Submissions"      value={stats.pendingSubmissions} sub="awaiting expert review" color="#1976D2" />
        <StatCard label="Trainer request pending" value={stats.pendingExperts}
          action="approve →" onAction={() => navigate('/admin/expert')} color="#e0a020" />
      </div>

      {/* Recent pending expert apps */}
      <div className="adm-section-card">
        <p className="adm-section-title">
          <AlertCircle size={16} />
          คำขอสมัคร Trainer 5 อันดับแรก
        </p>
        <div className="adm-list">
          {recentApps.length === 0 && <p style={{ color: '#555', fontSize: '0.85rem' }}>No pending requests</p>}
          {recentApps.map(app => (
            <div key={app._id} className="adm-list-item" onClick={() => navigate('/admin/expert')}>
              <div className="adm-list-avatar">{app.userId?.firstName?.charAt(0) || '?'}</div>
              <div className="adm-list-info">
                <div className="adm-list-name">{app.userId?.firstName} {app.userId?.lastName}</div>
                <div className="adm-list-meta">Date: {new Date(app.createdAt).toLocaleDateString('en-GB')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, sub, action, onAction, color }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-label">{label}</div>
      <div className="adm-stat-value" style={color ? { color } : {}}>{value}</div>
      <div className="adm-stat-sub">{sub}</div>
      {action && <div className="adm-stat-action" onClick={onAction}>{action}</div>}
    </div>
  );
}
