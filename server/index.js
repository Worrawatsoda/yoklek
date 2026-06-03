require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes         = require('./routes/auth');
const exerciseRoutes     = require('./routes/exercises');
const verifyRoutes       = require('./routes/verify');
const adminRoutes        = require('./routes/admin');
const workoutRoutes      = require('./routes/workoutlog');
const notificationRoutes = require('./routes/notifications');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

app.use('/api/auth',          authRoutes);
app.use('/api/exercises',    exerciseRoutes);
app.use('/api/verify',       verifyRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/workoutlogs',  workoutRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
