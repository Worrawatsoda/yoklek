import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

import { API } from '../../lib/api';
const token = () => localStorage.getItem('token');

const statusColor = { pending: '#ed8936', approved: '#48bb78', rejected: '#e53e3e' };

export default function Moderation() {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetch(`${API}/admin/submissions`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(data => setSubmissions(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  return (
    <>
      <h1 className="adm-page-title">Moderation</h1>
      <p className="adm-page-sub">Exercise verification submissions</p>

      <div className="adm-section-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #252525', color: '#555' }}>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 500 }}>User</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 500 }}>Exercise</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 500 }}>Date</th>
              <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 500 }}>Status</th>
              <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 500 }}>Video</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 500 }}>Reviewed by</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(s => (
              <tr key={s._id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '10px', color: '#fff' }}>
                  {s.userId?.firstName} {s.userId?.lastName}
                  <div style={{ fontSize: '0.7rem', color: '#555' }}>{s.userId?.email}</div>
                </td>
                <td style={{ padding: '10px', color: '#888' }}>
                  {s.exerciseId?.name}
                  <div style={{ fontSize: '0.7rem', color: '#444' }}>{s.exerciseId?.muscleGroup}</div>
                </td>
                <td style={{ padding: '10px', color: '#666', whiteSpace: 'nowrap' }}>
                  {new Date(s.createdAt).toLocaleDateString('en-GB')}
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <span className="adm-badge" style={{
                    background: s.status === 'approved' ? '#1a4731' : s.status === 'rejected' ? '#3d0a0a' : '#3d2e0a',
                    color: statusColor[s.status],
                  }}>
                    {s.status === 'approved' ? <CheckCircle2 size={12} /> : s.status === 'rejected' ? <XCircle size={12} /> : null}
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <a href={s.videoUrl} target="_blank" rel="noreferrer" style={{ color: '#c0392b' }}>
                    <ExternalLink size={16} />
                  </a>
                </td>
                <td style={{ padding: '10px', color: '#666', fontSize: '0.78rem' }}>
                  {s.reviewedBy ? `${s.reviewedBy.firstName} ${s.reviewedBy.lastName}` : '-'}
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#444' }}>No submissions</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
