import { Link, useLocation } from "react-router-dom";
import { Home, Package, Dumbbell, BookOpen, TrendingUp } from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="bottom-nav">
      <Link
        to="/home"
        className={`nav-item ${currentPath === "/home" ? "active" : ""}`}
      >
        <Home size={24} />
        <span>Main</span>
      </Link>

      <Link
        to="/storage"
        className={`nav-item ${currentPath === "/storage" ? "active" : ""}`}
      >
        <Package size={24} />
        <span>Storage</span>
      </Link>

      <Link to="/record" className="nav-fab-container">
        <div className="nav-fab">
          <Dumbbell size={28} />
        </div>
      </Link>

      <Link
        to="/verify"
        className={`nav-item ${currentPath === "/verify" ? "active" : ""}`}
      >
        <BookOpen size={24} />
        <span>Verify</span>
      </Link>

      <Link
        to="/statistics"
        className={`nav-item ${currentPath === "/statistics" ? "active" : ""}`}
      >
        <TrendingUp size={24} />
        <span>Stats</span>
      </Link>
    </div>
  );
}
