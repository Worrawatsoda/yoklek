import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';

export function TopNavOnlyLayout() {
  return (
    <div className="app-layout">
      <TopNav />
      {/* paddingBottom is not needed since there is no Navbar */}
      <div className="scrollable-content" style={{ paddingTop: '80px', paddingBottom: '1.5rem' }}>
        <Outlet />
      </div>
    </div>
  );
}
