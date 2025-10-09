const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
  lrn: { type: String, default: null }, // Learner Reference Number for students
  teacherId: { type: String, default: null },
  adminId: { type: String, default: null },
  active: { type: Boolean, default: true },
  profileImage: { type: String, default: null }, // Profile image URL
   // studentId removed, use lrn instead
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', UserSchema);
