const mongoose = require('mongoose');

// In models/Class.js
const classSchema = new mongoose.Schema({
  className: { type: String, required: true, unique: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  time: { type: String }, // store as "HH:mm" (start time)
  endTime: { type: String }, // store as "HH:mm" (end time)
  day: { type: String, required: true },
  roomNumber: { type: String },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date }
}, { timestamps: true });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;