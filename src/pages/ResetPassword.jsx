import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { API } from '../lib/api';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="screen-container">
        <p style={{ color: '#e53e3e', textAlign: 'center', marginTop: '4rem' }}>Invalid reset link</p>
        <Link to="/login" className="link" style={{ marginTop: '1rem', fontSize: '0.75rem' }}>Back to Login</Link>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <h2 className="title" style={{ marginTop: '4rem', marginBottom: '2rem' }}>Reset Password</h2>

      <form className="form-group" onSubmit={handleSubmit}>
        <Input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Confirm New Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error && <p style={{ color: '#e53e3e', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}

        <Button variant="secondary" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
}

export default ResetPassword;
