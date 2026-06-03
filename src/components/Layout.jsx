import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { TopNav } from './TopNav';

export function Layout() {
  return (
    <div className="app-layout">
      <TopNav />
      <div className="scrollable-content" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <Outlet />
      </div>
      <Navbar />
    </div>
  );
}
