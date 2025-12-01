const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now }
});

const reactionSchema = new mongoose.Schema({
    emoji: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const fileAttachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  // Cloudinary fields for cloud storage
  cloudinaryUrl: { type: String }, // Secure URL from Cloudinary
  publicId: { type: String }, // Public ID for deletion
  resourceType: { type: String } // 'image', 'raw', 'video', etc.
});

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    datePosted: { type: Date, default: Date.now },
    comments: [commentSchema],
    reactions: [reactionSchema],
    // AYOS: Idinagdag ang field para sa mga nakakita na ng announcement
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // File attachments for announcements
    attachments: [fileAttachmentSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', AnnouncementSchema);