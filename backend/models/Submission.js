const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedAt: { type: Date },
  status: { type: String, enum: ['submitted', 'late', 'missing'], default: 'missing' },
  file: {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
  },
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
