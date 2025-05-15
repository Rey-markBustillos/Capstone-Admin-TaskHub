const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  file: {
    type: String, // Store the filename of the uploaded file
    default: '',
  },
  deadline: {
    type: Date,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class', // Associate task with Class
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
