import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

function Landing() {
  return (
    <div className="screen-container" style={{ height: '100vh', justifyContent: 'center' }}>
      <Logo style={{ marginTop: 'auto', marginBottom: 'auto' }} />
      
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/register" className="btn btn-primary">
          GET STARTED
        </Link>
        <Link to="/login" className="btn btn-outline">
          I ALREADY HAVE AN ACCOUNT
        </Link>
      </div>
    </div>
  );
}

export default Landing;
