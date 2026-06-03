import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { API } from '../lib/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStatus(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-container">
      <h2 className="title" style={{ marginTop: '4rem', marginBottom: '1rem' }}>Forgot Password</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '2rem' }}>
        กรอก email ที่ใช้สมัครสมาชิก เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้
      </p>

      <form className="form-group" onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && <p style={{ color: '#e53e3e', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
        {status && <p style={{ color: '#48bb78', fontSize: '0.8rem', textAlign: 'center' }}>{status}</p>}

        <Button variant="secondary" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <Link to="/login" className="link" style={{ marginTop: '1.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
        Back to Login
      </Link>
    </div>
  );
}

export default ForgotPassword;
