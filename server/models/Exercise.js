const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nameEn: { type: String, trim: true },
  muscleGroup: [{
    type: String,
    enum: ['Arm', 'Chest', 'Leg', 'Back', 'Shoulder'],
  }],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  description: { type: String },
  steps: [{ type: String }],
  warnings: [{ type: String }],
  imageUrl: { type: String },
  youtubeVideoId: { type: String },
  verified: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

exerciseSchema.index({ name: 'text', nameEn: 'text', description: 'text' });

module.exports = mongoose.model('Exercise', exerciseSchema);
