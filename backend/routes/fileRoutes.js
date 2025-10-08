const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'temp');
    console.log(`[DEBUG] Upload destination: ${uploadPath}`);
    cb(null, uploadPath); // Absolute path to temp directory
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log(`[DEBUG] Generated filename: ${filename}`);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Increased to 50MB limit for PPT files
    fieldSize: 10 * 1024 * 1024, // 10MB field size limit
  },
  fileFilter: function (req, file, cb) {
    console.log(`[DEBUG] File upload attempt: ${file.originalname}, type: ${file.mimetype}`);
    
    // Check file types - be more permissive with MIME types
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint' // .ppt
    ];
    
    // Also check file extension as backup
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.txt', '.pdf', '.jpg', '.jpeg', '.png', '.docx', '.doc', '.pptx', '.ppt'];
    
    console.log(`[DEBUG] File extension: ${fileExtension}`);
    console.log(`[DEBUG] MIME type check: ${allowedTypes.includes(file.mimetype)}`);
    console.log(`[DEBUG] Extension check: ${allowedExtensions.includes(fileExtension)}`);
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      console.log(`[DEBUG] File type approved: ${file.mimetype} / ${fileExtension}`);
      cb(null, true);
    } else {
      console.log(`[ERROR] Unsupported file type: ${file.mimetype} / ${fileExtension}`);
      cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload JPG, PNG, TXT, DOCX, PPT, PPTX, or PDF files.`), false);
    }
  }
});

// Extract text from uploaded file with error handling
router.post('/extract-text', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('[ERROR] Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File too large. Please upload a file smaller than 50MB or convert to image format.',
          error: 'File size limit exceeded'
        });
      }
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    } else if (err) {
      console.error('[ERROR] File upload error:', err);
      return res.status(400).json({
        message: err.message || 'File upload failed',
        error: 'Upload error'
      });
    }
    next();
  });
}, fileController.extractTextFromFile);

// Simple test endpoint
router.get('/test', (req, res) => {
  console.log('[DEBUG] File test endpoint hit');
  res.json({ message: 'File routes are working!' });
});

module.exports = router;