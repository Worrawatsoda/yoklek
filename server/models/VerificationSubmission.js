const mongoose = require('mongoose');

const verificationSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  videoUrl: { type: String, required: true },
  note: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  feedback: { type: String, default: '' },
  reviewedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('VerificationSubmission', verificationSubmissionSchema);
