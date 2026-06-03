const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Exercise = require('../models/Exercise');
const VerificationSubmission = require('../models/VerificationSubmission');
const ExpertApplication = require('../models/ExpertApplication');
const { notify } = require('../utils/notify');

// Middleware: require expert or admin
function requireExpert(req, res, next) {
  if (req.user.role !== 'expert' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Expert access required' });
  }
  next();
}

// Middleware: require admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// ─── USER: Submit verification ───────────────────────────────────────────────
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { exerciseId, videoUrl, note } = req.body;
    if (!exerciseId || !videoUrl) {
      return res.status(400).json({ message: 'Exercise and video URL are required' });
    }

    // Check duplicate pending
    const existing = await VerificationSubmission.findOne({
      userId: req.user.userId, exerciseId, status: 'pending',
    });
    if (existing) {
      return res.status(409).json({ message: 'You already have a pending submission for this exercise' });
    }

    const submission = await VerificationSubmission.create({
      userId: req.user.userId, exerciseId, videoUrl, note,
    });
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── USER: My submissions history ────────────────────────────────────────────
router.get('/my-submissions', authMiddleware, async (req, res) => {
  try {
    const submissions = await VerificationSubmission
      .find({ userId: req.user.userId })
      .populate('exerciseId', 'name muscleGroup imageUrl')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── EXPERT: Get pending submissions ─────────────────────────────────────────
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    // Attach role to req.user
    const user = await User.findById(req.user.userId).select('role');
    if (!user || (user.role !== 'expert' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Expert access required' });
    }

    const submissions = await VerificationSubmission
      .find({ status: 'pending' })
      .populate('exerciseId', 'name muscleGroup imageUrl')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: 1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── EXPERT: Approve submission ───────────────────────────────────────────────
router.put('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('role');
    if (!user || (user.role !== 'expert' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Expert access required' });
    }

    const submission = await VerificationSubmission.findById(req.params.id)
      .populate('exerciseId', 'name');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Submission already reviewed' });
    }

    const { feedback } = req.body;

    // Update submission
    submission.status = 'approved';
    submission.reviewedBy = req.user.userId;
    submission.feedback = feedback || '';
    submission.reviewedAt = new Date();
    await submission.save();

    // Give badge to THIS user only (do NOT touch exercise.verified globally)
    const targetUser = await User.findById(submission.userId);
    if (targetUser && submission.exerciseId) {
      const exerciseId = submission.exerciseId._id;
      const alreadyHasBadge = targetUser.badges.some(
        (b) => b.exerciseId?.toString() === exerciseId.toString()
      );
      if (!alreadyHasBadge) {
        targetUser.badges.push({ exerciseId });
        await targetUser.save();
      }
    }

    const exName = submission.exerciseId?.name || 'ท่าออกกำลังกาย';
    await notify(submission.userId, 'verify_approved',
      `✅ Verified: ${exName}`,
      `ยินดีด้วย! ท่า "${exName}" ของคุณผ่านการตรวจสอบแล้ว คุณได้รับ badge เรียบร้อย 🏅`
    );

    res.json({ message: 'Approved successfully', submission });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── EXPERT: Reject submission ────────────────────────────────────────────────
router.put('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('role');
    if (!user || (user.role !== 'expert' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Expert access required' });
    }

    const submission = await VerificationSubmission.findById(req.params.id)
      .populate('exerciseId', 'name');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Submission already reviewed' });
    }

    const { feedback } = req.body;
    submission.status = 'rejected';
    submission.reviewedBy = req.user.userId;
    submission.feedback = feedback || '';
    submission.reviewedAt = new Date();
    await submission.save();

    const exName = submission.exerciseId?.name || 'ท่าออกกำลังกาย';
    await notify(submission.userId, 'verify_rejected',
      `❌ ไม่ผ่าน: ${exName}`,
      `ท่า "${exName}" ยังไม่ผ่านการตรวจสอบ${feedback ? ` — Feedback: ${feedback}` : ''} ลองใหม่ได้เลยนะ!`
    );

    res.json({ message: 'Rejected', submission });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── USER: Apply to be expert ─────────────────────────────────────────────────
router.post('/apply-expert', authMiddleware, async (req, res) => {
  try {
    const { experience, certifications, videoUrl, links, certImageUrls } = req.body;
    if (!experience) return res.status(400).json({ message: 'Experience is required' });

    const existing = await ExpertApplication.findOne({
      userId: req.user.userId, status: 'pending',
    });
    if (existing) {
      return res.status(409).json({ message: 'You already have a pending application' });
    }

    const app = await ExpertApplication.create({
      userId: req.user.userId, experience, certifications, videoUrl, links: links || [], certImageUrls: certImageUrls || [],
    });
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── USER: Check my expert application status ─────────────────────────────────
router.get('/my-expert-application', authMiddleware, async (req, res) => {
  try {
    const app = await ExpertApplication.findOne({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(app || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: List expert applications ─────────────────────────────────────────
router.get('/expert-applications', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('role');
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    const apps = await ExpertApplication
      .find({ status: 'pending' })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: 1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: Approve expert application ────────────────────────────────────────
router.put('/expert-applications/:id/approve', authMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId).select('role');
    if (!admin || admin.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    const app = await ExpertApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    app.status = 'approved';
    app.reviewedBy = req.user.userId;
    await app.save();

    await User.findByIdAndUpdate(app.userId, { role: 'expert' });
    res.json({ message: 'Expert approved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
