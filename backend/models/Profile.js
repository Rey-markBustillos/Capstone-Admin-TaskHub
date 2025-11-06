const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One profile per user
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for full image URL
ProfileSchema.virtual('fullImageUrl').get(function() {
  return `${process.env.SERVER_URL || 'http://localhost:5000'}${this.imageUrl}`;
});

// Ensure virtual fields are serialized
ProfileSchema.set('toJSON', { virtuals: true });
ProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Profile', ProfileSchema);