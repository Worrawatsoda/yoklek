const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({ reps: Number, weight: Number }, { _id: false });

const exerciseLogSchema = new mongoose.Schema({
  exerciseName: { type: String, required: true },
  exerciseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
  goal:         { type: Number, default: 0 },
  sets:         [setSchema],
}, { _id: false });

const workoutLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:      { type: Date, required: true },
  exercises: [exerciseLogSchema],
}, { timestamps: true });

workoutLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
