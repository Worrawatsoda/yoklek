const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['welcome', 'verify_approved', 'verify_rejected', 'expert_approved', 'expert_rejected',
           'streak_7', 'streak_30', 'streak_100', 'daily_motivation'],
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
