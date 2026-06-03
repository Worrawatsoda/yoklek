import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../lib/api';

function Profile() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', username: '',
    email: '', birthDate: '', gender: '', weight: '', height: '',
  });
  const [savedForm, setSavedForm] = useState(null);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const loaded = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          username: data.username || '',
          email: data.email || '',
          birthDate: data.birthDate ? data.birthDate.slice(0, 10) : '',
          gender: data.gender || '',
          weight: data.weight ?? '',
          height: data.height ?? '',
        };
        setForm(loaded);
        setSavedForm(loaded);
        setLoading(false);
      })
      .catch(() => { setLoading(false); setError('Failed to load profile'); });
  }, [navigate]);

  const today = new Date().toISOString().slice(0, 10);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // ไม่ให้ติดลบ — ตัดเครื่องหมายลบทิ้ง
  const setPositive = (field) => (e) => {
    const v = e.target.value;
    if (v === '' || Number(v) >= 0) setForm((f) => ({ ...f, [field]: v }));
  };

  // วันเกิดต้องไม่เกินวันนี้ — ถ้าเลือกอนาคตให้ดึงกลับเป็นวันนี้
  const setBirthDate = (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, birthDate: v && v > today ? today : v }));
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSavedForm(form);
      setSuccess('Profile saved');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (savedForm) setForm(savedForm);
    setIsEditing(false);
    setError('');
    setPwForm({ currentPassword: '', newPassword: '' });
    setPwError('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/auth/profile/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(pwForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPwSuccess('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '' });
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      setPwError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 1.5rem 0.5rem' }}>
        <button className="profile-back-btn" onClick={() => navigate(-1)} style={{ position: 'static', top: 'auto', left: 'auto' }}>
          <ChevronLeft size={24} />
        </button>

        <h2 className="profile-title">Profile</h2>

        <div style={{ display: 'flex', gap: '8px' }}>
          {!isEditing ? (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              <Edit2 size={18} color="var(--text-muted)" />
            </button>
          ) : (
            <>
              <button className="edit-btn" onClick={handleSave} disabled={saving}>
                <Check size={18} color="#48bb78" />
              </button>
              <button className="edit-btn" onClick={handleCancel}>
                <X size={18} color="#e53e3e" />
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p style={{ color: '#e53e3e', fontSize: '0.8rem', textAlign: 'center', margin: '0 1.5rem' }}>{error}</p>}
      {success && <p style={{ color: '#48bb78', fontSize: '0.8rem', textAlign: 'center', margin: '0 1.5rem' }}>{success}</p>}

      {/* Form Fields */}
      <div className="profile-form">
        <div className="form-field">
          <label>First Name</label>
          <input type="text" value={form.firstName} readOnly={!isEditing} className={isEditing ? 'editable' : ''} onChange={set('firstName')} />
        </div>

        <div className="form-field">
          <label>Last Name</label>
          <input type="text" value={form.lastName} readOnly={!isEditing} className={isEditing ? 'editable' : ''} onChange={set('lastName')} />
        </div>

        <div className="form-field">
          <label>Username</label>
          <input type="text" value={form.username} readOnly={!isEditing} className={isEditing ? 'editable' : ''} onChange={set('username')} placeholder={isEditing ? 'Enter username' : '-'} />
        </div>

        <div className="form-field">
          <label>Email</label>
          <input type="email" value={form.email} readOnly={!isEditing} className={isEditing ? 'editable' : ''} onChange={set('email')} />
        </div>

        {/* 2-Column Grid */}
        <div className="form-row">
          <div className="form-field">
            <label>Birth</label>
            <input type="date" value={form.birthDate} readOnly={!isEditing} max={today} className={isEditing ? 'editable' : ''} onChange={setBirthDate} />
          </div>
          <div className="form-field">
            <label>Gender</label>
            <select value={form.gender} disabled={!isEditing} className={isEditing ? 'editable' : ''} onChange={set('gender')} style={{ opacity: isEditing ? 1 : 0.8 }}>
              <option value="">-</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Weight</label>
            <div className="input-with-text">
              <input type="number" value={form.weight} readOnly={!isEditing} min="0" className={isEditing ? 'editable' : ''} onChange={setPositive('weight')} />
              <span className="input-suffix">kg.</span>
            </div>
          </div>
          <div className="form-field">
            <label>Height</label>
            <div className="input-with-text">
              <input type="number" value={form.height} readOnly={!isEditing} min="0" className={isEditing ? 'editable' : ''} onChange={setPositive('height')} />
              <span className="input-suffix">cm.</span>
            </div>
          </div>
        </div>

        {/* Change Password — ล่างสุดตอน edit */}
        {isEditing && (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="form-field">
              <label>Current Password</label>
              <input type="password" value={pwForm.currentPassword} className="editable" onChange={(e) => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>New Password</label>
              <input type="password" value={pwForm.newPassword} className="editable" onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
            </div>
            {pwError && <p style={{ color: '#e53e3e', fontSize: '0.75rem' }}>{pwError}</p>}
            {pwSuccess && <p style={{ color: '#48bb78', fontSize: '0.75rem' }}>{pwSuccess}</p>}
            <button type="submit" style={{ background: 'var(--accent-red)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontWeight: 600 }}>
              Change Password
            </button>
          </form>
        )}

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{ marginTop: '1.5rem', marginBottom: '2rem', width: '100%', padding: '14px', background: 'transparent', border: '1px solid #e53e3e', borderRadius: '8px', color: '#e53e3e', fontWeight: 600, cursor: 'pointer' }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default Profile;
