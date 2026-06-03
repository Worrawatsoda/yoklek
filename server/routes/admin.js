const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Exercise = require('../models/Exercise');
const ExpertApplication = require('../models/ExpertApplication');
const VerificationSubmission = require('../models/VerificationSubmission');
const WorkoutLog = require('../models/WorkoutLog');
const { notify } = require('../utils/notify');

async function requireAdmin(req, res, next) {
  const user = await User.findById(req.user.userId).select('role');
  if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
}

// ── Stats overview ────────────────────────────────────────────────────────────
router.get('/stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [users, exercises, pendingSubmissions, pendingExpertApps, totalExperts] = await Promise.all([
      User.countDocuments(),
      Exercise.countDocuments(),
      VerificationSubmission.countDocuments({ status: 'pending' }),
      ExpertApplication.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'expert' }),
    ]);
    res.json({ users, exercises, pendingSubmissions, pendingExperts: pendingExpertApps, totalExperts });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 10, role, sort = 'newest' } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
        { username:  { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt:  1 },
      az:     { firstName:  1 },
      za:     { firstName: -1 },
    };
    const sortObj = sortMap[sort] || { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-password -resetToken -resetTokenExpiry')
        .sort(sortObj).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);
    // attach workout count + last active per user
    const userIds = users.map(u => u._id);
    const logs = await WorkoutLog.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 }, lastDate: { $max: '$date' } } },
    ]);
    const logMap = {};
    logs.forEach(l => { logMap[l._id.toString()] = l; });

    const result = users.map(u => {
      const log = logMap[u._id.toString()];
      return {
        ...u.toObject(),
        workoutCount: log?.count || 0,
        lastActive: log?.lastDate || null,
      };
    });
    res.json({ users: result, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// ── User detail: streak + workout logs ───────────────────────────────────────
router.get('/users/:id/stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -resetToken -resetTokenExpiry');
    if (!user) return res.status(404).json({ message: 'Not found' });

    // Last 90 days workout dates for streak calendar
    const since = new Date(); since.setDate(since.getDate() - 90);
    const logs = await WorkoutLog.find({ userId: req.params.id, date: { $gte: since } })
      .sort({ date: -1 }).lean();

    const toLocalISO = (d) => {
      const dt = new Date(d);
      return [dt.getUTCFullYear(), String(dt.getUTCMonth() + 1).padStart(2, '0'), String(dt.getUTCDate()).padStart(2, '0')].join('-');
    };
    const activeDates = [...new Set(logs.map(l => toLocalISO(l.date)))];

    // Recent 20 workout logs with exercises
    const recent = await WorkoutLog.find({ userId: req.params.id })
      .sort({ date: -1 }).limit(20).lean();

    res.json({ user, activeDates, recentLogs: recent });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/users/:id/profile', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const allowed = ['firstName','lastName','username','email','birthDate','gender','weight','height'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    if (update.email) {
      const existing = await User.findOne({ email: update.email, _id: { $ne: req.params.id } });
      if (existing) return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/users/:id/role', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'expert', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ── Expert Applications ───────────────────────────────────────────────────────
router.get('/expert-applications', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const apps = await ExpertApplication.find()
      .populate('userId', 'firstName lastName email username birthDate gender weight height badges')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/expert-applications/:id/approve', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const app = await ExpertApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Not found' });
    app.status = 'approved'; app.reviewedBy = req.user.userId; await app.save();
    await User.findByIdAndUpdate(app.userId, { role: 'expert' });
    await notify(app.userId, 'expert_approved',
      '🏅 คุณได้รับสถานะ Expert แล้ว!',
      'ยินดีด้วย! Admin อนุมัติคำขอเป็น Trainer ของคุณแล้ว ตอนนี้คุณสามารถ review การ verify ของสมาชิกได้เลย'
    );
    res.json({ message: 'Expert approved' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.put('/expert-applications/:id/reject', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const app = await ExpertApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Not found' });
    const { reviewNote } = req.body;
    app.status = 'rejected';
    app.reviewedBy = req.user.userId;
    if (reviewNote) app.reviewNote = reviewNote;
    await app.save();
    await notify(app.userId, 'expert_rejected',
      '❌ คำขอ Trainer ไม่ผ่านการอนุมัติ',
      `Admin ได้ตรวจสอบคำขอของคุณแล้ว แต่ยังไม่ผ่านในครั้งนี้${reviewNote ? ` — หมายเหตุ: ${reviewNote}` : ''} สามารถสมัครใหม่ได้ในภายหลัง`
    );
    res.json({ message: 'Application rejected' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// ── Exercises ─────────────────────────────────────────────────────────────────
router.get('/exercises', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 10, muscleGroup, status, sort = 'newest' } = req.query;
    const query = {};
    if (search) query.$or = [
      { name:   { $regex: search, $options: 'i' } },
      { nameEn: { $regex: search, $options: 'i' } },
    ];
    if (muscleGroup) query.muscleGroup = { $in: [muscleGroup] };
    if (status === 'published') query.verified = true;
    if (status === 'draft')     query.verified = false;
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt:  1 },
      az:     { name:  1 },
      za:     { name: -1 },
    };
    const sortObj = sortMap[sort] || { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);
    const [exercises, total] = await Promise.all([
      Exercise.find(query).sort(sortObj).skip(skip).limit(Number(limit)),
      Exercise.countDocuments(query),
    ]);
    // count verified users per exercise from badges
    const ids = exercises.map(e => e._id);
    const badgeCounts = await User.aggregate([
      { $unwind: '$badges' },
      { $match: { 'badges.exerciseId': { $in: ids } } },
      { $group: { _id: '$badges.exerciseId', count: { $sum: 1 } } },
    ]);
    const badgeMap = {};
    badgeCounts.forEach(b => { badgeMap[b._id.toString()] = b.count; });
    const result = exercises.map(e => ({ ...e.toObject(), verifiedUsers: badgeMap[e._id.toString()] || 0 }));
    res.json({ exercises: result, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/exercises', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const ex = await Exercise.create({ ...req.body, verified: req.body.verified ?? false });
    res.status(201).json(ex);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.put('/exercises/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const ex = await Exercise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ex) return res.status(404).json({ message: 'Not found' });
    res.json(ex);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/exercises/:id/toggle-verified', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const ex = await Exercise.findById(req.params.id);
    if (!ex) return res.status(404).json({ message: 'Not found' });
    ex.verified = !ex.verified; await ex.save();
    res.json(ex);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/exercises/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    await Exercise.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ── Verification Submissions ──────────────────────────────────────────────────
router.get('/submissions', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const subs = await VerificationSubmission.find()
      .populate('userId', 'firstName lastName email')
      .populate('exerciseId', 'name muscleGroup')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
