require('dotenv').config();
const bcrypt = require('bcryptjs');
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
    let user = await User.findOne({ email: ADMIN.email.toLowerCase() });

    if (user) {
      user.name = ADMIN.name;
      user.password = await bcrypt.hash(ADMIN.password, 10);
      user.role = ADMIN.role;
      user.adminId = ADMIN.adminId;
      user.active = ADMIN.active;
      await user.save();
      console.log('Admin account updated:', ADMIN.email);
    } else {
      user = new User({
        ...ADMIN,
        password: await bcrypt.hash(ADMIN.password, 10),
        email: ADMIN.email.toLowerCase(),
      });
      await user.save();
      console.log('Admin account created:', ADMIN.email);
    }
  } catch (err) {
    console.error('Failed to seed admin:', err.message);
    process.exit(1);
  }
}

seedAdmin();
