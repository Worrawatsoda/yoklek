import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    birthDate: '', gender: '', weight: '', height: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const today = new Date().toISOString().slice(0, 10);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // ไม่ให้ติดลบ
  const setPositive = (field) => (e) => {
    const v = e.target.value;
    if (v === '' || Number(v) >= 0) setForm((f) => ({ ...f, [field]: v }));
  };

  // วันเกิดต้องไม่เกินวันนี้
  const setBirthDate = (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, birthDate: v && v > today ? today : v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        ...form,
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
      });
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-container">
      <button
        onClick={() => navigate('/landing')}
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          width: 40,
          height: 40,
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <ChevronLeft size={24} />
      </button>

      <h2 className="title" style={{ marginTop: '2rem', marginBottom: '2rem' }}>Register</h2>

      <form className="form-group" style={{ marginBottom: '2rem' }} onSubmit={handleSubmit}>
        <Input type="email" placeholder="Email address" value={form.email} onChange={set('email')} />
        <Input type="password" placeholder="Password" value={form.password} onChange={set('password')} />

        <div className="row-group">
          <Input type="text" placeholder="First Name" value={form.firstName} onChange={set('firstName')} />
          <Input type="text" placeholder="Last Name" value={form.lastName} onChange={set('lastName')} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%', overflow: 'hidden', maxWidth: '100%' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '0.25rem' }}>Date of Birth</label>
          <Input type="date" value={form.birthDate} onChange={setBirthDate} max={today} style={{ width: '100%', maxWidth: '100%', display: 'block' }} />
        </div>

        <Select
          defaultLabel="Gender"
          options={genderOptions}
          value={form.gender}
          onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
        />

        <div className="row-group">
          <Input type="number" placeholder="Weight (kg)" value={form.weight} onChange={setPositive('weight')} min="0" />
          <Input type="number" placeholder="Height (cm)" value={form.height} onChange={setPositive('height')} min="0" />
        </div>

        {error && (
          <p style={{ color: '#e53e3e', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>
        )}

        <Button variant="secondary" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign up'}
        </Button>
      </form>

      <Link to="/login" className="link" style={{ marginTop: '1.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
        Already Have an Account?
      </Link>
    </div>
  );
}

export default Register;
