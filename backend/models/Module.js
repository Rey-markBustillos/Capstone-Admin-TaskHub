const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
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
  // Cloudinary fields for cloud storage
  cloudinaryUrl: {
    type: String,
    default: null
  },
  viewerUrl: {
    type: String,
    default: null
  },
  publicId: {
    type: String,
    default: null
  },
  resourceType: {
    type: String,
    default: 'raw'
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for efficient queries
moduleSchema.index({ classId: 1, uploadDate: -1 });
moduleSchema.index({ uploadedBy: 1 });
moduleSchema.index({ title: 'text', description: 'text' });

// Virtual for file size in human readable format
moduleSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Method to increment download count
moduleSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

module.exports = mongoose.model('Module', moduleSchema);