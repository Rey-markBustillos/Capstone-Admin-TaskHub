const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  teacherName: {
    type: String,
    required: true,
    trim: true,
  },
  className: {
    type: String,
    required: true,
    trim: true,
  },
  time: {
    type: Date,
    required: true,
  },
  roomNumber: {
    type: String,
    required: true,
    trim: true,
  },
  profilePic: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
