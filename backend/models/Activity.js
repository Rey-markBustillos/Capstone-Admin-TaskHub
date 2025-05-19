const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    instructions: { type: String },
    deadline: { type: Date, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    className: { type: String, required: true },
    points: { type: Number, default: 0 },
    attachedFile: {
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
