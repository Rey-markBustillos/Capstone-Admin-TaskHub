const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String, required: true },
  className: { type: String, required: true },
  time: { type: Date },
  roomNumber: { type: String },
  profilePic: { type: String },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Class', ClassSchema);
