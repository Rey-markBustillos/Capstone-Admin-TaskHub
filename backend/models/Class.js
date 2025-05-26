// models/Class.js
const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  teacherName: String,
  className: String,
  time: Date,
  roomNumber: String,
  profilePic: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Class', ClassSchema);
