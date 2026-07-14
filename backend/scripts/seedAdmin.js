require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN = {
  name: 'TaskHub Admin',
  email: 'admin.taskhub@als.gov.ph',
  password: 'Admin+taskhubalsph',
  role: 'admin',
  adminId: 'ADMIN-001',
  active: true,
};

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ email: ADMIN.email.toLowerCase() });

    if (user) {
      user.name = ADMIN.name;
      user.password = ADMIN.password;
      user.role = ADMIN.role;
      user.adminId = ADMIN.adminId;
      user.active = ADMIN.active;
      await user.save();
      console.log('Admin account updated:', ADMIN.email);
    } else {
      user = new User({
        ...ADMIN,
        email: ADMIN.email.toLowerCase(),
      });
      await user.save();
      console.log('Admin account created:', ADMIN.email);
    }
  } catch (err) {
    console.error('Failed to seed admin:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
