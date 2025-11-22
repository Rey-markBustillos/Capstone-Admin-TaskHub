const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  page: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better query performance
visitSchema.index({ timestamp: -1 });
visitSchema.index({ page: 1 });

module.exports = mongoose.model('Visit', visitSchema);