const Notification = require('../models/Notification');

async function notify(userId, type, title, message) {
  try {
    await Notification.create({ userId, type, title, message });
  } catch (err) {
    console.error('notify error:', err.message);
  }
}

module.exports = { notify };
