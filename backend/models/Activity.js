// models/Activity.js
const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: String,
  instructions: String,
  deadline: Date,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  className: String,
  points: Number,
  attachedFile: {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
  },
});

module.exports = mongoose.model('Activity', ActivitySchema);
