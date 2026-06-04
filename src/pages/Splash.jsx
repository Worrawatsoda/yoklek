import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      // ถ้าล็อกอินค้างไว้ (มี token) ข้ามไปหน้า home เลย
      const token = localStorage.getItem('token');
      navigate(token ? '/home' : '/landing');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="screen-container" style={{ height: '100vh', justifyContent: 'center' }}>
      <Logo style={{ marginBottom: 0 }} />
    </div>
  );
}

export default Splash;
