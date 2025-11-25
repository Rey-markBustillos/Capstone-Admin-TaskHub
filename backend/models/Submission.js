const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  filePath: {
    type: String // Local path (for backward compatibility)
  },
  fileName: {
    type: String // Original file name
  },
  cloudinaryUrl: {
    type: String // Cloudinary public URL
  },
  cloudinaryPublicId: {
    type: String // Cloudinary public ID for deletion
  },
  fileType: {
    type: String // File MIME type
  },
  fileSize: {
    type: Number // File size in bytes
  },
  score: {
    type: Number,
    default: null // Initially no score
  }
});

module.exports = mongoose.model('Submission', submissionSchema);