const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  addComment,
  toggleReaction,
  markAsViewed // AYOS: I-import ang bagong function
} = require('../controllers/announcementController');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/announcements');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `announcement-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mp3|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, documents, videos, audio, and archive files are allowed'));
    }
  }
});

// Routes for creating and getting all announcements
router.route('/')
  .get(getAllAnnouncements)
  .post(upload.array('attachments', 5), createAnnouncement); // Allow up to 5 files

// Routes for a specific announcement by ID
router.route('/:id')
  .get(getAnnouncementById)
  .put(updateAnnouncement)
  .delete(deleteAnnouncement);

// Route for adding a comment
router.route('/:id/comments').post(addComment);

// Route for toggling a reaction
router.route('/:id/reactions').post(toggleReaction);

// Route for downloading announcement attachments
router.get('/attachment/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    console.log('File request:', filename);
    console.log('File path:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filename);
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check if it's a download request or view request
    const download = req.query.download === 'true';
    
    if (download) {
      res.download(filePath);
    } else {
      // For viewing in browser - set appropriate headers
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      
      // Set proper content types for inline viewing
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        contentType = `image/${ext.slice(1) === 'jpg' ? 'jpeg' : ext.slice(1)}`;
      } else if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (['.mp4', '.webm'].includes(ext)) {
        contentType = `video/${ext.slice(1)}`;
      } else if (['.mp3', '.wav', '.ogg'].includes(ext)) {
        contentType = `audio/${ext.slice(1)}`;
      }
      
      console.log('Serving file with content type:', contentType);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.sendFile(filePath);
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ message: 'Error accessing file', error: error.message });
  }
});

// Simple file serving route for direct access
router.get('/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    console.log('🌐 FILES REQUEST:', filename);
    console.log('📁 File path:', filePath);
    console.log('✅ File exists:', fs.existsSync(filePath));
    
    if (fs.existsSync(filePath)) {
      // Set proper headers for images
      const ext = path.extname(filename).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        res.setHeader('Content-Type', `image/${ext.slice(1) === 'jpg' ? 'jpeg' : ext.slice(1)}`);
      }
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.sendFile(filePath);
    } else {
      console.log('❌ File not found:', filename);
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('❌ Error in /files/ route:', error);
    res.status(500).send('Server error');
  }
});

// AYOS: Bagong route para sa pag-view
router.route('/:id/view').post(markAsViewed);

module.exports = router;