const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const WorkoutLog = require('../models/WorkoutLog');
const Exercise   = require('../models/Exercise');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { notify } = require('../utils/notify');

// GET stats summary for current user
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const logs = await WorkoutLog.find({ userId }).lean();

    // Aggregate totals + best weight per exercise
    let totalSets = 0;
    let totalWeight = 0;
    const bestMap = {}; // exerciseName -> { maxWeight, exerciseId }

    logs.forEach(log => {
      log.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          totalSets++;
          totalWeight += (set.reps || 0) * (set.weight || 0);
          const w = Number(set.weight) || 0;
          if (!bestMap[ex.exerciseName] || w > bestMap[ex.exerciseName].maxWeight) {
            bestMap[ex.exerciseName] = { maxWeight: w, exerciseId: ex.exerciseId };
          }
        });
      });
    });

    // Unique workout days (for streak + activeDays count)
    const toLocalISO = (d) => {
      const dt = new Date(d);
      return [dt.getUTCFullYear(), String(dt.getUTCMonth() + 1).padStart(2, '0'), String(dt.getUTCDate()).padStart(2, '0')].join('-');
    };
    const dayStrings = [...new Set(
      logs.map(l => toLocalISO(l.date))
    )].sort().reverse(); // newest first

    const activeDays = dayStrings.length;

    // Session streak — breaks only when gap between workouts > 3 days
    // Allows up to 2 rest days (e.g. full weekend) without breaking streak
    let dayStreak = 0;
    if (dayStrings.length > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const mostRecent = new Date(dayStrings[0]);
      const gapFromToday = Math.round((today - mostRecent) / 86400000);

      if (gapFromToday <= 3) {
        dayStreak = 1;
        for (let i = 1; i < dayStrings.length; i++) {
          const prev = new Date(dayStrings[i - 1]);
          const curr = new Date(dayStrings[i]);
          const diff = Math.round((prev - curr) / 86400000);
          if (diff <= 3) dayStreak++;
          else break;
        }
      }
    }

    // Fetch user once (badges + goals)
    const user = await User.findById(userId)
      .populate('badges.exerciseId', 'name')
      .lean();

    // Bulk-lookup imageUrl for each exercise in bestMap
    const exIds = Object.values(bestMap).map(v => v.exerciseId).filter(Boolean);
    const exDocs = await Exercise.find({ _id: { $in: exIds } }).select('imageUrl').lean();
    const imageMap = {};
    exDocs.forEach(e => { imageMap[e._id.toString()] = e.imageUrl || null; });

    // Build goal map from user.goals
    const goalMap = {};
    (user?.goals || []).forEach(g => {
      goalMap[g.exerciseId?.toString()] = g.goalWeight || 0;
    });

    // Best stats: top 10 by max weight, include exerciseId + goalWeight
    const bestStats = Object.entries(bestMap)
      .map(([exerciseName, { maxWeight, exerciseId }]) => ({
        exerciseName,
        exerciseId: exerciseId || null,
        maxWeight,
        goalWeight: exerciseId ? (goalMap[exerciseId.toString()] || 0) : 0,
        imageUrl:   exerciseId ? (imageMap[exerciseId.toString()] || null) : null,
      }))
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 10);

    const badges = (user?.badges || []).map(b => ({
      exerciseId:   b.exerciseId?._id,
      exerciseName: b.exerciseId?.name || 'Unknown',
      earnedAt:     b.earnedAt,
    }));

    res.json({
      totalWorkouts: logs.length,
      dayStreak,
      totalWeight:   Math.round(totalWeight),
      totalSets,
      activeDays,
      goalDays:      user.goalDays || 0,
      badges,
      bestStats,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET workout logs for current user (optional ?date=YYYY-MM-DD)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const query = { userId: req.user.userId };

    if (date) {
      const start = new Date(date);
      const end   = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const logs = await WorkoutLog.find(query)
      .populate('exercises.exerciseId', 'imageUrl')
      .sort({ date: -1 })
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST save a workout log
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, exercises } = req.body;

    if (!date) return res.status(400).json({ message: 'date is required' });
    if (!exercises || exercises.length === 0)
      return res.status(400).json({ message: 'exercises are required' });

    // Reject future dates only
    const logDate = new Date(date);
    const today   = new Date(); today.setHours(23, 59, 59, 999);
    if (logDate > today) return res.status(400).json({ message: 'ไม่สามารถ log วันในอนาคตได้' });

    for (const ex of exercises) {
      if (!ex.exerciseId || !ex.exerciseName)
        return res.status(400).json({ message: 'exerciseId and exerciseName are required' });
      if (!ex.sets || ex.sets.length === 0)
        return res.status(400).json({ message: `No sets for ${ex.exerciseName}` });
    }

    const log = await WorkoutLog.create({
      userId: req.user.userId,
      date:   new Date(date),
      exercises: exercises.map(ex => ({
        exerciseId:   ex.exerciseId,
        exerciseName: ex.exerciseName,
        goal:         Number(ex.goal) || 0,
        sets:         ex.sets.map(s => ({
          reps:   Number(s.reps)   || 0,
          weight: Number(s.weight) || 0,
        })),
      })),
    });

    // Check streak milestones (7, 30, 100 unique workout days)
    const allLogs = await WorkoutLog.find({ userId: req.user.userId }).lean();
    const uniqueDays = new Set(allLogs.map(l => {
      const d = new Date(l.date);
      return [d.getUTCFullYear(), String(d.getUTCMonth() + 1).padStart(2, '0'), String(d.getUTCDate()).padStart(2, '0')].join('-');
    })).size;

    const MILESTONES = {
      7:   { type: 'streak_7',   title: '🔥 7 วันแห่งความมุ่งมั่น!',    message: 'คุณออกกำลังกายครบ 7 วันแล้ว! Streak กำลังลุกไหม้ อย่าหยุด!' },
      30:  { type: 'streak_30',  title: '💪 30 วัน — นิสัยใหม่เกิดแล้ว!', message: 'ออกกำลังกายครบ 30 วัน! คุณกำลังสร้างนิสัยที่ดีที่สุดในชีวิต 🏆' },
      100: { type: 'streak_100', title: '🏆 100 วัน Legend!',             message: 'เหลือเชื่อ! 100 วันของการออกกำลังกาย คุณคือแรงบันดาลใจของทุกคน 🌟' },
    };

    // Send response first — milestone notification is a side-effect and must not cause a retry-duplicate
    res.status(201).json(log);

    if (MILESTONES[uniqueDays]) {
      const { type, title, message } = MILESTONES[uniqueDays];
      // Atomic upsert — prevents duplicate milestone notification on concurrent POST requests
      await Notification.findOneAndUpdate(
        { userId: req.user.userId, type },
        { $setOnInsert: { userId: req.user.userId, type, title, message } },
        { upsert: true }
      ).catch(err => console.error('milestone notify error:', err.message));
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
