const express = require('express');
const Exercise = require('../models/Exercise');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET all exercises with search + filter
router.get('/', async (req, res) => {
  try {
    const { search, muscleGroup, verified, difficulty } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (muscleGroup && muscleGroup !== 'All') query.muscleGroup = { $in: [muscleGroup] };
    if (verified === 'true') query.verified = true;
    if (difficulty) query.difficulty = difficulty;

    const exercises = await Exercise.find(query).sort({ verified: -1, createdAt: -1 });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET single exercise
router.get('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create exercise (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const exercise = await Exercise.create({ ...req.body, createdBy: req.user.userId });
    res.status(201).json(exercise);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
