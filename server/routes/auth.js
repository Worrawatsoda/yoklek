const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { sendResetEmail } = require('../utils/mailer');
const { notify } = require('../utils/notify');

const router = express.Router();

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

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
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
