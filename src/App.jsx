import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Splash from "./pages/Splash";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Notification from "./pages/Notification";
import Profile from "./pages/Profile";
import Storage from "./pages/Storage";
import Record from "./pages/Record";
import Verify from "./pages/Verify";
import Statistics from "./pages/Statistics";
import { Layout } from "./components/Layout";
import { TopNavOnlyLayout } from "./components/TopNavOnlyLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminExpert from "./pages/admin/Expert";
import AdminUser from "./pages/admin/User";
import AdminContent from "./pages/admin/Content";
import AdminModeration from "./pages/admin/Moderation";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Admin (desktop) — requires login + admin role */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard"  element={<AdminDashboard />} />
            <Route path="expert"     element={<AdminExpert />} />
            <Route path="user"       element={<AdminUser />} />
            <Route path="content"    element={<AdminContent />} />
            <Route path="moderation" element={<AdminModeration />} />
          </Route>
        </Route>

        {/* Protected routes (with Layout) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/storage" element={<Storage />} />
            <Route path="/record" element={<Record />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/statistics" element={<Statistics />} />
          </Route>

          {/* Routes with TopNav only */}
          <Route element={<TopNavOnlyLayout />}>
            <Route path="/notifications" element={<Notification />} />
          </Route>

          {/* Standalone Pages */}
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
