const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    datePosted: { type: Date, default: Date.now },
    // Optional: add fields like expirationDate, attachments, etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', AnnouncementSchema);
