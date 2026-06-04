import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertCircle, Lock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../lib/api';
const token = () => localStorage.getItem('token');

// ─── helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    approved: { label: 'Verified', icon: <CheckCircle2 size={12} />, cls: 'verified' },
    pending:  { label: 'Pending',  icon: <Clock size={12} />,        cls: 'pending'  },
    rejected: { label: 'Denied',   icon: <AlertCircle size={12} />,  cls: 'denied'   },
  };
  const { label, icon, cls } = map[status] || map.pending;
  return <div className={`status-badge ${cls}`}>{icon} {label}</div>;
}

// ─── Submit Tab ───────────────────────────────────────────────────────────────
function SubmitTab() {
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    // Fetch exercises and user badges in parallel, then filter out already-verified ones
    Promise.all([
      fetch(`${API}/exercises`).then(r => r.json()),
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
    ]).then(([allExercises, user]) => {
      const verifiedIds = new Set(
        (user.badges || []).map(b => b.exerciseId?.toString())
      );
      setExercises(allExercises.filter(ex => !verifiedIds.has(ex._id)));
    }).catch(() => {});
    loadHistory();
  }, []);

  const loadHistory = () => {
    fetch(`${API}/verify/my-submissions`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(setHistory).catch(() => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!exerciseId || !videoUrl) { setError('Please select an exercise and enter a video URL'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/verify/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ exerciseId, videoUrl, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Submitted successfully! An expert will review within 3 days.');
      setExerciseId(''); setVideoUrl(''); setNote('');
      loadHistory();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <>
      <div className="verify-header">
        <h2 className="title" style={{ marginBottom: '0.2rem', fontSize: '1.4rem', marginTop: 0 }}>Expert Form Verification</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4', marginTop: 0 }}>
          Submit your video for an expert review.<br />Get results within 3 days.
        </p>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        {/* Exercise selector */}
        <select
          className="verify-select"
          value={exerciseId}
          onChange={e => setExerciseId(e.target.value)}
        >
          <option value="" disabled>Select Exercise</option>
          {exercises.map(ex => (
            <option key={ex._id} value={ex._id}>{ex.name} ({ex.muscleGroup})</option>
          ))}
        </select>

        {/* Video URL */}
        <input
          type="url"
          className="verify-input"
          placeholder="Your YouTube video URL (e.g. https://youtube.com/...)"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
        />

        {/* Note */}
        <textarea
          className="verify-input"
          placeholder="Note / Additional info (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          style={{ resize: 'none' }}
        />

        {error && <p style={{ color: '#e53e3e', fontSize: '0.8rem' }}>{error}</p>}
        {success && <p style={{ color: '#48bb78', fontSize: '0.8rem' }}>{success}</p>}

        <button className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '1rem', fontSize: '1rem' }} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {/* History */}
      <h3 className="section-title">Verification History</h3>
      <div className="history-list">
        {history.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No submissions yet</p>
        )}
        {history.map(sub => (
          <div key={sub._id} className="history-card">
            <div className="history-card-header" onClick={() => toggleExpand(sub._id)} style={{ cursor: 'pointer' }}>
              <div className="history-icon-wrapper">
                {sub.exerciseId?.imageUrl
                  ? <img src={sub.exerciseId.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  : <div style={{ width: 40, height: 40, borderRadius: 8, background: '#333' }} />}
              </div>
              <div className="history-info">
                <h4>{sub.exerciseId?.name || 'Exercise'}</h4>
                <span>{new Date(sub.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <StatusBadge status={sub.status} />
              {expanded[sub._id] ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
            </div>

            {expanded[sub._id] && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <a href={sub.videoUrl} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--accent-red)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ExternalLink size={14} /> View Video
                </a>
                {sub.note && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Note: {sub.note}</p>}
                {sub.feedback && (
                  <div className="expert-comment">
                    Expert feedback: {sub.feedback}
                  </div>
                )}
                {sub.reviewedBy && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Reviewed by: {sub.reviewedBy.firstName} {sub.reviewedBy.lastName}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Expert Review Tab ────────────────────────────────────────────────────────
function ReviewTab({ userRole }) {
  const [pending, setPending] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState('');

  useEffect(() => { loadPending(); }, []);

  const loadPending = () => {
    setLoading(true);
    fetch(`${API}/verify/pending`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(data => { setPending(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const act = async (id, action) => {
    setActing(id + action);
    try {
      const res = await fetch(`${API}/verify/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ feedback: feedback[id] || '' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'ทำรายการไม่สำเร็จ');
      }
      loadPending();
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
    } finally {
      setActing('');
    }
  };

  if (userRole !== 'expert' && userRole !== 'admin') {
    return <ExpertLockScreen />;
  }

  return (
    <>
      <div className="verify-header">
        <h2 className="title" style={{ marginBottom: '0.2rem', fontSize: '1.4rem', marginTop: 0 }}>Expert Review Panel</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: 0 }}>
          {pending.length} submission{pending.length !== 1 ? 's' : ''} waiting for review
        </p>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading...</p> : null}
      {!loading && pending.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>No pending submissions</p>
      )}

      <div className="history-list">
        {pending.map(sub => (
          <div key={sub._id} className="history-card" style={{ gap: '10px' }}>
            {/* Header */}
            <div className="history-card-header">
              <div className="history-icon-wrapper">
                {sub.exerciseId?.imageUrl
                  ? <img src={sub.exerciseId.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  : <div style={{ width: 40, height: 40, borderRadius: 8, background: '#333' }} />}
              </div>
              <div className="history-info">
                <h4>{sub.exerciseId?.name}</h4>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {sub.userId?.firstName} {sub.userId?.lastName} · {sub.userId?.email}
                </span>
              </div>
              <StatusBadge status="pending" />
            </div>

            {/* Video link */}
            <a href={sub.videoUrl} target="_blank" rel="noreferrer"
              style={{ color: 'var(--accent-red)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ExternalLink size={14} /> Watch Video
            </a>

            {sub.note && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Note: {sub.note}</p>
            )}

            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Submitted: {new Date(sub.createdAt).toLocaleDateString()}
            </p>

            {/* Feedback input */}
            <textarea
              className="verify-input"
              placeholder="Feedback to user (optional)"
              value={feedback[sub._id] || ''}
              onChange={e => setFeedback(f => ({ ...f, [sub._id]: e.target.value }))}
              rows={2}
              style={{ resize: 'none', fontSize: '0.8rem' }}
            />

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => act(sub._id, 'approve')}
                disabled={acting === sub._id + 'approve'}
                style={{ flex: 1, padding: '10px', background: '#276749', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                {acting === sub._id + 'approve' ? '...' : '✓ Approve'}
              </button>
              <button
                onClick={() => act(sub._id, 'reject')}
                disabled={acting === sub._id + 'reject'}
                style={{ flex: 1, padding: '10px', background: '#742a2a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                {acting === sub._id + 'reject' ? '...' : '✗ Reject'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── ImgBB upload helper ──────────────────────────────────────────────────────
const IMGBB_KEY = import.meta.env.VITE_IMGBB_KEY;

async function uploadToImgBB(file) {
  const body = new FormData();
  body.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
    method: 'POST', body,
  });
  const data = await res.json();
  if (!data.success) throw new Error('Upload failed');
  return data.data.url;
}

// ─── Expert Lock / Apply Screen ───────────────────────────────────────────────
function ExpertLockScreen() {
  const [showForm, setShowForm] = useState(false);
  const [myApp, setMyApp] = useState(undefined); // undefined = loading
  const [form, setForm] = useState({ experience: '', certifications: '', videoUrl: '', certImageUrls: [], links: [] });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!IMGBB_KEY) { setError('VITE_IMGBB_KEY ยังไม่ได้ตั้งค่าใน .env'); return; }
    if (form.certImageUrls.length + files.length > 5) {
      setError('อัปโหลดได้สูงสุด 5 รูป'); return;
    }
    setUploading(true);
    setError('');
    try {
      const urls = await Promise.all(files.map(uploadToImgBB));
      setForm(f => ({ ...f, certImageUrls: [...f.certImageUrls, ...urls] }));
    } catch {
      setError('Upload รูปไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, certImageUrls: f.certImageUrls.filter((_, i) => i !== idx) }));
  };

  useEffect(() => {
    fetch(`${API}/verify/my-expert-application`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(data => setMyApp(data || null))
      .catch(() => setMyApp(null));
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.experience) { setError('Please describe your experience'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/verify/apply-expert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMyApp(data);
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  // Loading
  if (myApp === undefined) {
    return <div className="review-view-container"><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>;
  }

  // Pending
  if (myApp?.status === 'pending') {
    return (
      <div className="review-view-container">
        <Clock size={72} color="#ed8936" strokeWidth={1} />
        <h2 className="review-title" style={{ marginTop: '1rem' }}>Application Pending</h2>
        <p className="review-subtitle">
          Your expert application is being reviewed.<br />We'll notify you within 3–5 days.
        </p>
        {myApp.experience && (
          <div style={{ marginTop: '1rem', background: '#252525', borderRadius: 10, padding: '12px 16px', width: '100%', maxWidth: 320, textAlign: 'left' }}>
            <p style={{ fontSize: '0.7rem', color: '#555', margin: '0 0 4px' }}>ข้อมูลที่ส่ง</p>
            <p style={{ fontSize: '0.82rem', color: '#ccc', margin: 0, lineHeight: 1.5 }}>{myApp.experience}</p>
            {myApp.certifications && (
              <p style={{ fontSize: '0.78rem', color: '#888', margin: '6px 0 0' }}>🎓 {myApp.certifications}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Rejected
  if (myApp?.status === 'rejected') {
    return (
      <div className="review-view-container">
        <AlertCircle size={72} color="#e53e3e" strokeWidth={1} />
        <h2 className="review-title" style={{ marginTop: '1rem', color: '#e53e3e' }}>ไม่ผ่านการอนุมัติ</h2>
        <p className="review-subtitle">Admin ได้ตรวจสอบคำขอของคุณแล้ว แต่ยังไม่ผ่านในครั้งนี้</p>
        {myApp.reviewNote && (
          <div style={{ marginTop: '0.75rem', background: '#2a1515', border: '1px solid #5a1e1e', borderRadius: 10, padding: '12px 16px', width: '100%', maxWidth: 320, textAlign: 'left' }}>
            <p style={{ fontSize: '0.7rem', color: '#e53e3e', margin: '0 0 4px' }}>หมายเหตุจาก Admin</p>
            <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>{myApp.reviewNote}</p>
          </div>
        )}
        <button
          className="btn review-btn"
          style={{ marginTop: '1.5rem' }}
          onClick={() => {
            setMyApp(null);
            setForm({ experience: '', certifications: '', videoUrl: '', certImageUrls: [], links: [] });
            setShowForm(true);
          }}
        >
          สมัครใหม่
        </button>
      </div>
    );
  }

  // Not applied — show lock screen or form
  if (!showForm) {
    return (
      <div className="review-view-container">
        <Lock size={120} color="var(--text-muted)" strokeWidth={1} />
        <h2 className="review-title">Expert Only</h2>
        <p className="review-subtitle">Register as an expert to review exercise<br />submissions for the community.</p>
        <button className="btn review-btn" onClick={() => setShowForm(true)}>Register Expert</button>
      </div>
    );
  }

  return (
    <div className="form-card" style={{ marginTop: 0 }}>
      <h2 className="title" style={{ marginBottom: '0.2rem', fontSize: '1.4rem', marginTop: 0 }}>Proof of Expertise</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4', marginTop: 0 }}>
        Upload your certification or proof of experience.<br />Admin will review within 3–5 days.
      </p>

      <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <textarea
          className="verify-input"
          placeholder="Your experience in weight training / fitness (required)"
          value={form.experience}
          onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
          rows={3}
          style={{ resize: 'none' }}
          required
        />
        <input
          type="text"
          className="verify-input"
          placeholder="Certifications (e.g. NASM, ACE, ACSM)"
          value={form.certifications}
          onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))}
        />
        <input
          type="url"
          className="verify-input"
          placeholder="Video URL (YouTube — แสดงตัวเองออกกำลังกาย, optional)"
          value={form.videoUrl}
          onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
        />

        {/* Certificate image upload */}
        <div>
          <label style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: 6, display: 'block' }}>
            รูปใบ Certificate — อัปโหลดได้สูงสุด 5 รูป {form.certImageUrls.length > 0 && `(${form.certImageUrls.length}/5)`}
          </label>

          {/* Preview grid */}
          {form.certImageUrls.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
              {form.certImageUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden' }}>
                  <img src={url} alt={`cert ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: '#fff', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button — hide when at max */}
          {form.certImageUrls.length < 5 && (
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#383838', borderRadius: 8, padding: '10px 14px',
              cursor: uploading ? 'not-allowed' : 'pointer', border: '1px dashed #555',
            }}>
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImagePick} disabled={uploading} />
              <span style={{ fontSize: '1.1rem' }}>📎</span>
              <span style={{ fontSize: '0.82rem', color: uploading ? '#888' : '#ccc' }}>
                {uploading ? 'กำลัง upload...' : 'เลือกรูปจากเครื่อง'}
              </span>
            </label>
          )}
        </div>

        {/* Dynamic links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: '0.78rem', color: '#aaa' }}>
            ลิงก์ LinkedIn / Portfolio / อื่นๆ {form.links.length > 0 && `(${form.links.length}/5)`}
          </label>

          {form.links.map((link, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6 }}>
              <select
                value={link.label}
                onChange={e => setForm(f => ({ ...f, links: f.links.map((l, i) => i === idx ? { ...l, label: e.target.value } : l) }))}
                style={{ width: 120, flexShrink: 0, background: '#383838', border: '1px solid #555', borderRadius: 8, color: '#fff', padding: '8px', fontSize: '0.78rem' }}
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Website">Website</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="url"
                className="verify-input"
                placeholder="https://..."
                value={link.url}
                onChange={e => setForm(f => ({ ...f, links: f.links.map((l, i) => i === idx ? { ...l, url: e.target.value } : l) }))}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, links: f.links.filter((_, i) => i !== idx) }))}
                style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}
              >✕</button>
            </div>
          ))}

          {form.links.length < 5 && (
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, links: [...f.links, { label: 'LinkedIn', url: '' }] }))}
              style={{ background: 'none', border: '1px dashed #555', borderRadius: 8, color: '#aaa', cursor: 'pointer', padding: '8px', fontSize: '0.8rem' }}
            >
              + เพิ่มลิงก์
            </button>
          )}
        </div>

        {error && <p style={{ color: '#e53e3e', fontSize: '0.8rem' }}>{error}</p>}

        <button className="btn btn-primary" style={{ padding: '1rem', fontSize: '1rem' }} disabled={submitting || uploading}>
          {submitting ? 'Submitting...' : uploading ? 'กำลัง upload รูป...' : 'Submit Application'}
        </button>
        <button type="button" onClick={() => setShowForm(false)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
          Cancel
        </button>
      </form>
    </div>
  );
}

// ─── Main Verify Page ─────────────────────────────────────────────────────────
function Verify() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('submit');
  const userRole = user?.role || 'user';

  return (
    <div className="verify-page">
      <div className="verify-tabs">
        <button className={`verify-tab ${activeTab === 'submit' ? 'active' : ''}`} onClick={() => setActiveTab('submit')}>
          Submit
        </button>
        <button className={`verify-tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>
          Review {(userRole === 'expert' || userRole === 'admin') ? '' : <Lock size={12} style={{ marginLeft: 4 }} />}
        </button>
      </div>

      {activeTab === 'submit' ? <SubmitTab /> : <ReviewTab userRole={userRole} />}
    </div>
  );
}

export default Verify;
