const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Notification = require('../models/Notification');

const MOTIVATIONS = [
  { title: '💪 วันนี้ออกกำลังกันเถอะ!', message: 'ทุก rep ที่ทำคือก้าวหนึ่งสู่เวอร์ชันที่ดีกว่าของตัวเอง' },
  { title: '🔥 ลุยได้เลย!', message: 'ความเจ็บปวดวันนี้คือความแข็งแกร่งของพรุ่งนี้ อย่าหยุด!' },
  { title: '🏆 เชื่อมั่นในตัวเอง', message: 'ร่างกายทำได้ทุกอย่าง แค่ต้องโน้มน้าวจิตใจก่อน' },
  { title: '⚡ พลังงานเต็ม100!', message: 'วันที่ไม่อยากออก คือวันที่ต้องออกมากที่สุด' },
  { title: '🎯 Focus วันนี้', message: 'อย่าเปรียบกับคนอื่น แข่งกับตัวเองเมื่อวาน' },
  { title: '🌟 เก่งมากแล้ว!', message: 'การมาวันนี้คือ 80% ของความสำเร็จแล้ว' },
  { title: '💥 Let\'s GO!', message: 'Consistency beats intensity — มาทุกวันสำคัญกว่า hype ครั้งเดียว' },
  { title: '🧠 Mindset ดี', message: 'Progress ไม่ได้วัดแค่น้ำหนัก วัดที่ความมุ่งมั่นที่เพิ่มขึ้น' },
  { title: '🚀 ไปต่อ!', message: 'สักวันหนึ่งคุณจะขอบคุณตัวเองที่ไม่ยอมแพ้วันนี้' },
  { title: '❤️ รักตัวเอง', message: 'ออกกำลังกายคือการให้รางวัลร่างกาย ไม่ใช่การลงโทษ' },
  { title: '🌄 เช้าวันใหม่', message: 'วันใหม่ โอกาสใหม่ เป้าหมายเดิม — ไม่มีคำว่าสายเกินไป' },
  { title: '🏋️ ยกให้หนักขึ้น', message: 'Weight ที่หนักวันนี้คือ warm-up ของเดือนหน้า' },
];

// GET notifications (auto-create daily motivation if needed)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Ensure exactly one daily_motivation per user per day (atomic upsert prevents race condition)
    const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setUTCHours(23, 59, 59, 999);
    const pick = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
    await Notification.findOneAndUpdate(
      { userId, type: 'daily_motivation', createdAt: { $gte: todayStart, $lte: todayEnd } },
      { $setOnInsert: { userId, type: 'daily_motivation', title: pick.title, message: pick.message } },
      { upsert: true }
    );

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET unread count only (for badge)
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.userId, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT mark all as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.userId, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT mark one as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { read: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
