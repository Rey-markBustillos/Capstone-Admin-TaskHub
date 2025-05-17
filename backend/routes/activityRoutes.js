const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createActivity } = require('../controllers/activityController');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists or create it
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp + original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// POST create activity with file upload
router.post('/', upload.single('attachedFile'), createActivity);

module.exports = router;
