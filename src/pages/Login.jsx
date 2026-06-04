import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

const backBtnStyle = {
  position: 'absolute', top: '1.5rem', left: '1.5rem',
  width: 40, height: 40, background: 'rgba(255,255,255,0.08)',
  border: 'none', borderRadius: 8, display: 'flex',
  alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer',
};

function Login() {
  const { login, verify2fa, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { requires2fa } = await login(email, password);
      if (requires2fa) {
        setStep('otp');
        setInfo(`ส่งรหัสยืนยันไปที่ ${email} แล้ว`);
        startCooldown();
      } else {
        navigate('/home'); // อุปกรณ์ถูกจำไว้ — เข้าเลย
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verify2fa(email, code, remember);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(''); setInfo('');
    try {
      await resendOtp(email);
      setInfo('ส่งรหัสใหม่แล้ว');
      setCode('');
      startCooldown();
    } catch (err) {
      setError(err.message);
    }
  };

  // ── หน้าจอกรอก OTP ──────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="screen-container">
        <button onClick={() => { setStep('credentials'); setCode(''); setError(''); setInfo(''); }} style={backBtnStyle}>
          <ChevronLeft size={24} />
        </button>

        <h2 className="title" style={{ marginTop: '4rem', marginBottom: '1rem' }}>Verify</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '2rem' }}>
          กรอกรหัส 6 หลักที่ส่งไปยังอีเมลของคุณ
        </p>

        <form className="form-group" onSubmit={handleVerify}>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="______"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.4rem' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 'auto' }} />
            จำอุปกรณ์นี้ไว้ 30 วัน (ไม่ต้องกรอกรหัสอีก)
          </label>

          {info && <p style={{ color: '#48bb78', fontSize: '0.8rem', textAlign: 'center' }}>{info}</p>}
          {error && <p style={{ color: '#e53e3e', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}

          <Button variant="secondary" disabled={loading || code.length !== 6}>
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>

        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          style={{
            marginTop: '1.5rem', background: 'none', border: 'none',
            color: resendCooldown > 0 ? '#555' : 'var(--text-main)',
            fontSize: '0.75rem', fontWeight: 600,
            cursor: resendCooldown > 0 ? 'default' : 'pointer',
          }}
        >
          {resendCooldown > 0 ? `ส่งรหัสใหม่ได้ใน ${resendCooldown} วินาที` : 'ส่งรหัสใหม่อีกครั้ง'}
        </button>
      </div>
    );
  }

  // ── หน้าจอ email + password ─────────────────────────────
  return (
    <div className="screen-container">
      <button onClick={() => navigate('/landing')} style={backBtnStyle}>
        <ChevronLeft size={24} />
      </button>

      <h2 className="title" style={{ marginTop: '4rem', marginBottom: '4rem' }}>Login</h2>

      <form className="form-group" onSubmit={handleLogin}>
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
