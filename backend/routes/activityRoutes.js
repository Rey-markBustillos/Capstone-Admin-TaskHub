const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Configuration ---

// Helper function to ensure directory exists
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage for Activity Attachments
const activityStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/activities';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `activity-${Date.now()}${ext}`);
  },
});

// Storage for Student Submissions
const submissionStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/submissions';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `submission-${Date.now()}${ext}`);
  },
});

// General File Filter
const fileFilter = (req, file, cb) => {
  cb(null, true); 
};

// Multer instance for Activity Attachments
const uploadActivity = multer({
  storage: activityStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});

// Multer instance for Student Submissions
const uploadSubmission = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});


// --- Routes ---
// IMPORTANT: Specific routes must come BEFORE general/parameterized routes.

// GET all activities for a class
router.get('/', activityController.getActivities);

// POST create a new activity
router.post('/', uploadActivity.single('attachment'), activityController.createActivity);

// GET a single submission for a student and activity
router.get('/submission', activityController.getSubmissionForActivity);

// DELETE a submission by its ID (for students)
router.delete('/submission/:id', activityController.deleteSubmission);

// GET all submissions for a student in a class
router.get('/submissions', activityController.getStudentSubmissions);

// GET submissions for a teacher to monitor
router.get('/submissions/teacher/:teacherId', activityController.getActivitySubmissionsByTeacher);

// PUT to update a submission's score
router.put('/submissions/score/:submissionId', activityController.updateActivityScore);

// POST a new submission for an activity
router.post('/submit', uploadSubmission.single('file'), activityController.submitActivity);

// PUT to resubmit an activity
router.put('/resubmit/:id', uploadSubmission.single('file'), activityController.resubmitActivity);

// --- Parameterized routes for a single activity must be last ---

// GET a single activity by its ID
router.get('/:id', activityController.getActivityById);

// PUT to update an activity
router.put('/:id', uploadActivity.single('attachment'), activityController.updateActivity);

// DELETE an activity
router.delete('/:id', activityController.deleteActivity);

module.exports = router;