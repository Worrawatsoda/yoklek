import { useEffect, useState } from 'react';
import { Search, AlertCircle, CheckCircle2, XCircle, Play, Image, Link2 } from 'lucide-react';
import { API } from '../../lib/api';
const token = () => localStorage.getItem('token');

function isYouTube(url) {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'));
}
function getYouTubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : null;
}

export default function Expert() {
  const [tab, setTab] = useState('pending');
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [evTab, setEvTab] = useState('video');
  const [acting, setActing] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNote, setRejectNote]   = useState('');

  const load = () => {
    fetch(`${API}/admin/expert-applications`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(data => { setApps(Array.isArray(data) ? data : []); })
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const filtered = apps.filter(a => {
    const matchTab =
      tab === 'pending'  ? a.status === 'pending'  :
      tab === 'active'   ? a.status === 'approved' :
                           a.status === 'rejected';
    const name = `${a.userId?.firstName || ''} ${a.userId?.lastName || ''}`.toLowerCase();
    return matchTab && name.includes(search.toLowerCase());
  });

  const act = async (id, action, note = '') => {
    setActing(id + action);
    await fetch(`${API}/admin/expert-applications/${id}/${action}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(note ? { reviewNote: note } : {}),
    });
    setActing('');
    setRejectingId(null);
    setRejectNote('');
    setSelected(null);
    load();
  };

  return (
    <>
      <h1 className="adm-page-title">Expert Management</h1>
      <p className="adm-page-sub">overview of the website "YOKLEK"</p>

      <div className="adm-expert-layout">
        {/* Left: list */}
        <div className="adm-expert-left">
          {/* Tabs */}
          <div className="adm-tabs">
            {['pending','active','reject'].map(t => (
              <button key={t} className={`adm-tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setSelected(null); }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="adm-search">
            <Search size={14} color="#555" />
            <input placeholder="search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Section label */}
          <div style={{ padding: '8px 12px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {tab === 'pending'  && <><AlertCircle size={14} color="#e0a020" /><span style={{ fontSize: '0.75rem', color: '#e0a020' }}>All Trainer request</span></>}
            {tab === 'active'   && <><CheckCircle2 size={14} color="#48bb78" /><span style={{ fontSize: '0.75rem', color: '#48bb78' }}>Active trainer</span></>}
            {tab === 'reject'   && <><XCircle size={14} color="#e53e3e" /><span style={{ fontSize: '0.75rem', color: '#e53e3e' }}>Reject Trainer</span></>}
          </div>

          {/* List */}
          <div className="adm-list-scroll">
            <div className="adm-list">
              {filtered.length === 0 && <p style={{ color: '#555', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>No records</p>}
              {filtered.map(app => (
                <div
                  key={app._id}
                  className={`adm-list-item ${selected?._id === app._id ? 'active-item' : ''}`}
                  onClick={() => { setSelected(app); setEvTab('video'); }}
                >
                  <div className="adm-list-avatar">{app.userId?.firstName?.charAt(0) || '?'}</div>
                  <div className="adm-list-info">
                    <div className="adm-list-name">{app.userId?.firstName} {app.userId?.lastName}</div>
                    <div className="adm-list-meta">Date: {new Date(app.createdAt).toLocaleDateString('en-GB')}</div>
                  </div>
                  {tab === 'active' && (
                    <span className="adm-badge active">active</span>
                  )}
                  {tab === 'reject' && (
                    <span className="adm-badge rejected">rejected</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: detail */}
        <div className="adm-expert-right">
          {!selected ? (
            <div className="adm-empty">
              <Search size={32} />
              <p>Select a trainer to view details</p>
            </div>
          ) : (
            <div className="adm-detail">
              {/* Header */}
              <div className="adm-detail-header">
                <div className="adm-detail-avatar">{selected.userId?.firstName?.charAt(0) || '?'}</div>
                <div>
                  <div className="adm-detail-name">{selected.userId?.firstName} {selected.userId?.lastName}</div>
                  <div className="adm-detail-email">@{selected.userId?.email?.split('@')[0]}</div>
                </div>
              </div>

              {/* Basic Details */}
              <div className="adm-fields-card">
                <h4>Basic Details</h4>
                <div className="adm-fields-grid">
                  <Field label="First Name" value={selected.userId?.firstName} />
                  <Field label="Last Name"  value={selected.userId?.lastName} />
                  <Field label="Username"   value={selected.userId?.username || '-'} />
                  <Field label="Email"      value={selected.userId?.email} />
                  <Field label="Date"       value={selected.userId?.birthDate ? new Date(selected.userId.birthDate).toLocaleDateString('en-GB') : '-'} />
                  <Field label="Gender"     value={selected.userId?.gender || '-'} />
                  <Field label="Weight"     value={selected.userId?.weight ? `${selected.userId.weight} kg` : '-'} />
                  <Field label="Height"     value={selected.userId?.height ? `${selected.userId.height} cm` : '-'} />
                </div>

                {/* Experience */}
                {selected.experience && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '0.65rem', color: '#555' }}>Experience</label>
                    <p style={{ fontSize: '0.8rem', color: '#ccc', margin: '4px 0 0', lineHeight: 1.5 }}>{selected.experience}</p>
                  </div>
                )}
                {selected.certifications && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '0.65rem', color: '#555' }}>Certifications</label>
                    <p style={{ fontSize: '0.8rem', color: '#ccc', margin: '4px 0 0' }}>{selected.certifications}</p>
                  </div>
                )}
              </div>

              {/* Actions — only show for pending */}
              {selected.status === 'pending' && (
                <div className="adm-actions" style={{ flexDirection: 'column', gap: 8 }}>
                  {rejectingId === selected._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                      <textarea
                        value={rejectNote}
                        onChange={e => setRejectNote(e.target.value)}
                        placeholder="หมายเหตุสำหรับผู้สมัคร (optional)"
                        rows={3}
                        style={{
                          width: '100%', background: '#1e1e1e', border: '1px solid #444',
                          borderRadius: 8, color: '#fff', padding: '8px 10px',
                          fontSize: '0.82rem', resize: 'vertical', boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="adm-btn-reject"
                          style={{ flex: 1 }}
                          disabled={!!acting}
                          onClick={() => act(selected._id, 'reject', rejectNote)}
                        >
                          {acting === selected._id + 'reject' ? 'Processing...' : 'Confirm Reject'}
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectNote(''); }}
                          style={{ flex: 1, background: '#333', border: 'none', borderRadius: 8, color: '#aaa', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                      <button
                        className="adm-btn-reject"
                        style={{ flex: 1 }}
                        disabled={!!acting}
                        onClick={() => { setRejectingId(selected._id); setRejectNote(''); }}
                      >
                        Reject
                      </button>
                      <button
                        className="adm-btn-approve"
                        style={{ flex: 1 }}
                        disabled={!!acting}
                        onClick={() => act(selected._id, 'approve')}
                      >
                        {acting === selected._id + 'approve' ? 'Processing...' : 'Approve'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selected.status === 'approved' && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span className="adm-badge active" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                    <CheckCircle2 size={14} /> Approved Expert
                  </span>
                </div>
              )}

              {selected.status === 'rejected' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span className="adm-badge rejected" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                    <XCircle size={14} /> Rejected
                  </span>
                  {selected.reviewNote && (
                    <p style={{ fontSize: '0.78rem', color: '#aaa', margin: 0, textAlign: 'center' }}>
                      หมายเหตุ: {selected.reviewNote}
                    </p>
                  )}
                </div>
              )}

              {/* Evidence */}
              <div className="adm-evidence">
                <h4>Evidence</h4>
                <div className="adm-evidence-tabs">
                  {['video','picture','link'].map(t => (
                    <button key={t} className={`adm-ev-tab ${evTab === t ? 'active' : ''}`} onClick={() => setEvTab(t)}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="adm-evidence-view">
                  {evTab === 'video' && (
                    selected.videoUrl && isYouTube(selected.videoUrl) ? (
                      <div style={{ position: 'relative', paddingBottom: '56.25%', width: '100%', height: 0 }}>
                        <iframe
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                          src={`https://www.youtube.com/embed/${getYouTubeId(selected.videoUrl)}?rel=0`}
                          title="Evidence" frameBorder="0" allowFullScreen
                        />
                      </div>
                    ) : selected.videoUrl ? (
                      <div className="adm-evidence-placeholder">
                        <Play size={36} />
                        <a href={selected.videoUrl} target="_blank" rel="noreferrer"
                          style={{ color: '#c0392b', fontSize: '0.75rem' }}>Open video link</a>
                      </div>
                    ) : (
                      <div className="adm-evidence-placeholder">
                        <Play size={36} />
                        <span style={{ color: '#555' }}>ไม่มีวิดีโอ</span>
                      </div>
                    )
                  )}

                  {evTab === 'picture' && (
                    selected.certImageUrls?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                        {selected.certImageUrls.map((url, i) => (
                          <img key={i} src={url} alt={`certificate ${i + 1}`}
                            style={{ width: '100%', objectFit: 'contain', borderRadius: 8, maxHeight: 260, background: '#111' }} />
                        ))}
                      </div>
                    ) : (
                      <div className="adm-evidence-placeholder">
                        <Image size={36} />
                        <span>ไม่มีรูปใบ Certificate</span>
                      </div>
                    )
                  )}

                  {evTab === 'link' && (
                    selected.links?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', padding: '0 4px' }}>
                        {selected.links.map((link, i) => (
                          <a key={i} href={link.url} target="_blank" rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e1e1e', borderRadius: 8, padding: '10px 14px', textDecoration: 'none' }}>
                            <Link2 size={16} color="#c0392b" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: 2 }}>{link.label}</div>
                              <div style={{ fontSize: '0.78rem', color: '#c0392b', wordBreak: 'break-all', lineHeight: 1.4 }}>{link.url}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="adm-evidence-placeholder">
                        <Link2 size={28} />
                        <span style={{ color: '#555' }}>ไม่มีลิงก์</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, value }) {
  return (
    <div className="adm-field">
      <label>{label}</label>
      <div className="adm-field-val">{value || '-'}</div>
    </div>
  );
}
