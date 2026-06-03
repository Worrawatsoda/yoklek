require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email: 'admin@yoklek.com' });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log('Admin role updated for existing user');
  } else {
    await User.create({
      email: 'admin@yoklek.com',
      password: 'Admin@1234',
      firstName: 'Admin',
      lastName: 'Yoklek',
      role: 'admin',
    });
    console.log('Admin user created');
  }

  await mongoose.disconnect();
  console.log('Done');
}

createAdmin().catch(console.error);
