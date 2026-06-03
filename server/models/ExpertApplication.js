const mongoose = require('mongoose');

const expertApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoUrl: { type: String },
  links: [{ label: { type: String }, url: { type: String } }],
  certImageUrls: [{ type: String }],
  experience: { type: String, required: true },
  certifications: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ExpertApplication', expertApplicationSchema);
