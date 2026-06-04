const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { sendResetEmail, sendOtpEmail } = require('../utils/mailer');
const { notify } = require('../utils/notify');

const router = express.Router();

// ── helpers ───────────────────────────────────────────────
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

const publicUser = (u) => ({
  id: u._id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role,
});

const signToken = (u) =>
  jwt.sign({ userId: u._id, email: u.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

// สร้าง OTP ใหม่ + ส่งอีเมล (ใช้ร่วมกันใน /login และ /resend-otp)
async function issueOtp(user) {
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 หลัก
  user.otpHash = sha256(code);
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที
  user.otpAttempts = 0;
  await user.save();
  await sendOtpEmail(user.email, code);
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, birthDate, gender, weight, height } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await User.create({ email, password, firstName, lastName, birthDate, gender, weight, height });

    await notify(user._id, 'welcome',
      `🎉 ยินดีต้อนรับสู่ YOKLEK, ${firstName}!`,
      'บัญชีของคุณพร้อมใช้งานแล้ว เริ่ม record การออกกำลังกายและ verify ท่าของคุณได้เลย 💪'
    );

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login — step 1: ตรวจรหัสผ่าน แล้วออก OTP (เว้นแต่อุปกรณ์ถูกจำไว้)
router.post('/login', async (req, res) => {
  try {
    const { email, password, deviceToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // บัญชี test/admin ที่อยู่ใน allowlist → ข้าม 2FA (อีเมล mock ไม่มี inbox จริง)
    const bypassList = (process.env.OTP_BYPASS_EMAILS || '')
      .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (bypassList.includes(user.email.toLowerCase())) {
      return res.json({ token: signToken(user), user: publicUser(user) });
    }

    // อุปกรณ์ถูกจำไว้และยังไม่หมดอายุ → ข้าม 2FA เข้าเลย
    if (deviceToken) {
      const h = sha256(deviceToken);
      const dev = (user.trustedDevices || []).find(d => d.tokenHash === h && d.expiresAt > new Date());
      if (dev) {
        return res.json({ token: signToken(user), user: publicUser(user) });
      }
    }

    // ออก OTP ส่งเข้าอีเมล
    try {
      await issueOtp(user);
    } catch (mailErr) {
      console.error('OTP mail error:', mailErr.message);
      return res.status(500).json({ message: 'ส่งรหัสยืนยันไม่สำเร็จ ลองใหม่อีกครั้ง' });
    }

    res.json({ requires2fa: true, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login — step 2: ตรวจ OTP แล้วคืน JWT (+ deviceToken ถ้าเลือกจำอุปกรณ์)
router.post('/verify-2fa', async (req, res) => {
  try {
    const { email, code, rememberDevice } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const user = await User.findOne({ email });
    if (!user || !user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ message: 'ไม่มีคำขอ OTP กรุณาเข้าสู่ระบบใหม่' });
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'รหัสหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
    if (user.otpAttempts >= 5) {
      return res.status(429).json({ message: 'กรอกผิดเกินกำหนด กรุณาเข้าสู่ระบบใหม่' });
    }

    if (sha256(code) !== user.otpHash) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(401).json({ message: 'รหัสไม่ถูกต้อง' });
    }

    // สำเร็จ — ล้าง OTP
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;

    let newDeviceToken;
    if (rememberDevice) {
      newDeviceToken = crypto.randomBytes(32).toString('hex');
      // เก็บกวาดอุปกรณ์ที่หมดอายุ แล้วเพิ่มอันใหม่ (30 วัน)
      user.trustedDevices = (user.trustedDevices || []).filter(d => d.expiresAt > new Date());
      user.trustedDevices.push({
        tokenHash: sha256(newDeviceToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }
    await user.save();

    res.json({ token: signToken(user), user: publicUser(user), deviceToken: newDeviceToken });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ส่ง OTP ใหม่
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // ตอบ OK เสมอ กันเดาว่าอีเมลมีอยู่จริงไหม
    if (!user) return res.json({ message: 'OTP resent if the account exists' });
    try {
      await issueOtp(user);
    } catch (mailErr) {
      console.error('OTP resend error:', mailErr.message);
      return res.status(500).json({ message: 'ส่งรหัสไม่สำเร็จ ลองใหม่อีกครั้ง' });
    }
    res.json({ message: 'OTP resent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    // Always respond OK to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    try {
      await sendResetEmail(email, resetLink);
    } catch (mailErr) {
      console.error('Mail error:', mailErr.message);
      // Still respond OK — don't leak email existence, but log the error
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });

    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get current user (protected)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile (protected)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, username, email, birthDate, gender, weight, height, goalDays } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: 'Email already in use' });
      user.email = email;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (username !== undefined) user.username = username;
    if (birthDate !== undefined) user.birthDate = birthDate || null;
    if (gender !== undefined) user.gender = gender;
    if (weight !== undefined) user.weight = weight ? Number(weight) : null;
    if (height !== undefined) user.height = height ? Number(height) : null;
    if (goalDays !== undefined) user.goalDays = Number(goalDays) || 0;

    await user.save();
    const updated = user.toObject();
    delete updated.password;
    delete updated.resetToken;
    delete updated.resetTokenExpiry;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Change password (protected)
router.put('/profile/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.userId);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Set / update goal weight for one exercise (upsert)
router.put('/exercise-goal', authMiddleware, async (req, res) => {
  try {
    const { exerciseId, goalWeight } = req.body;
    if (!exerciseId) return res.status(400).json({ message: 'exerciseId is required' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = user.goals.find(g => g.exerciseId.toString() === exerciseId);
    if (existing) {
      existing.goalWeight = Number(goalWeight) || 0;
    } else {
      user.goals.push({ exerciseId, goalWeight: Number(goalWeight) || 0 });
    }
    await user.save();
    res.json({ message: 'Goal updated', goals: user.goals });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
