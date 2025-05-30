const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/activities'); // siguraduhing existing at writable ito
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

// File filter - accept only images (jpg, jpeg, png, gif) and pdf
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed'));
  }
};

// Multer upload with limits and fileFilter
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter,
});

// CRUD routes
router.post('/', activityController.createActivity);
router.get('/', activityController.getActivities);
router.get('/:id', activityController.getActivityById);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

// Upload route for activity attachment with validation
router.post('/upload', upload.single('file'), activityController.uploadActivityAttachment);

// Route for teacher's activity submissions
router.get('/submissions/:teacherId', activityController.getActivitySubmissionsByTeacher);

module.exports = router;
