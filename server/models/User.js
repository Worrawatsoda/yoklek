const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  username: { type: String, trim: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  birthDate: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  weight: { type: Number },
  height: { type: Number },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  // Login 2FA (email OTP)
  otpHash: { type: String },
  otpExpiry: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  // Devices ที่จำไว้ ข้าม 2FA 30 วัน
  trustedDevices: [{
    tokenHash: { type: String },
    expiresAt: { type: Date },
  }],
  role: { type: String, enum: ['user', 'expert', 'admin'], default: 'user' },
  goalDays: { type: Number, default: 0 },
  badges: [{ exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }, earnedAt: { type: Date, default: Date.now } }],
  goals: [{ exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }, goalWeight: { type: Number } }],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
