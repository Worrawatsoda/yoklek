import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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

      <h2 className="title" style={{ marginTop: '4rem', marginBottom: '4rem' }}>Login</h2>

      <form className="form-group" onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Link to="/forgot-password" className="link link-right" style={{ fontSize: '0.7rem' }}>
          Forgotten your password?
        </Link>

        {error && (
          <p style={{ color: '#e53e3e', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>
        )}

        <Button variant="secondary" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </div>
  );
}

export default Login;
