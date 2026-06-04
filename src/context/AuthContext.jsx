import { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch fresh user data (including role/badges) from server
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // merge กับ user เดิม ไม่ให้ field อื่น (เช่น weight/height) หายไป
        setUser((prev) => {
          const merged = {
            ...prev,
            id: data._id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            badges: data.badges,
          };
          localStorage.setItem('user', JSON.stringify(merged));
          return merged;
        });
      }
    } catch {}
  };

  const fetchUnreadCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { count } = await res.json();
        setUnreadCount(count);
      }
    } catch {}
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      refreshUser();
      fetchUnreadCount();
    }
    setLoading(false);
  }, []);

  // เซ็ต session หลังได้ JWT (ใช้ร่วมกันทั้ง trusted-device login และ verify-2fa)
  const finishLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    fetchUnreadCount();
  };

  // step 1 — ส่ง email+password (แนบ deviceToken ถ้าเคยจำอุปกรณ์ไว้)
  // คืน { requires2fa: true } ถ้าต้องกรอก OTP ต่อ, หรือเข้าระบบเลยถ้าอุปกรณ์ถูกจำไว้
  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, deviceToken: localStorage.getItem('deviceToken') }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    if (data.requires2fa) return { requires2fa: true };
    finishLogin(data);
    return { requires2fa: false };
  };

  // step 2 — ยืนยัน OTP
  const verify2fa = async (email, code, rememberDevice) => {
    const res = await fetch(`${API}/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, rememberDevice }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Verification failed');
    if (data.deviceToken) localStorage.setItem('deviceToken', data.deviceToken);
    finishLogin(data);
    return data.user;
  };

  const resendOtp = async (email) => {
    const res = await fetch(`${API}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'ส่งรหัสไม่สำเร็จ');
    }
  };

  const register = async (formData) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    fetchUnreadCount();
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verify2fa, resendOtp, register, logout, refreshUser, unreadCount, fetchUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
