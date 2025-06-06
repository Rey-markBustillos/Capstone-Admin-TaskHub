const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/activities');
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

// Error handling middleware for Multer
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: 'File upload error: ' + err.message });
  } else if (err) {
    return res.status(400).json({ message: 'File processing error: ' + err.message });
  }
  next();
};

// CRUD routes
router.post('/', upload.single('attachment'), activityController.createActivity);
router.get('/', activityController.getActivities);

// --- Place all /submissions and /submit routes BEFORE any /:id routes ---

// Route for fetching student submissions for a class
router.get('/submissions', activityController.getStudentSubmissions);

// Route for teacher's activity submissions
router.get('/submissions/:teacherId', activityController.getActivitySubmissionsByTeacher);

// Route for updating submission score by activity submission ID
router.put('/submissions/score/:submissionId', activityController.updateActivityScore);

// Route for submitting activity (student submission)
router.post('/submit', upload.single('attachment'), activityController.submitActivity);

// --- Parameterized routes at the end ---
router.get('/:id', activityController.getActivityById);
router.put('/:id', upload.single('attachment'), activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

// Apply the error handling middleware
router.use(multerErrorHandler);

module.exports = router;