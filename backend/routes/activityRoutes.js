const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// --- Routes ---

// GET all activities for a class
router.get('/', activityController.getActivities);

// POST create a new activity (still uses multer/cloudinary if needed)
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// If you want to keep attachment upload for activities, keep this part
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const activityCloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'taskhub/activities',
    public_id: (req, file) => `activity-${Date.now()}`,
    resource_type: 'auto',
  },
});
const fileFilter = (req, file, cb) => { cb(null, true); };
const uploadActivity = multer({
  storage: activityCloudinaryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});
router.post('/', uploadActivity.single('attachment'), activityController.createActivity);

// GET a single submission for a student and activity
router.get('/submission', activityController.getSubmissionForActivity);

// GET to download a submission file (legacy, can be removed if not needed)
router.get('/submission/:id/download', activityController.downloadSubmissionFile);

// GET to serve submission file directly (legacy, can be removed if not needed)
router.get('/submission/:id/file', async (req, res) => {
  // ...existing code...
});

// DEBUG: List files in uploads directory (legacy, can be removed if not needed)
router.get('/debug/uploads', (req, res) => {
  // ...existing code...
});

// DEBUG: Get submission file info (legacy, can be removed if not needed)
router.get('/submission/:id/info', async (req, res) => {
  // ...existing code...
});

// Get all students' scores for a class
router.get('/export-scores', require('../controllers/activityController').exportScores);

// DELETE a submission by its ID (for students)
router.delete('/submission/:id', activityController.deleteSubmission);

// GET all submissions for a student in a class
router.get('/submissions', activityController.getSubmissionsForStudentInClass);

// GET submissions for a teacher to monitor
router.get('/submissions/teacher/:teacherId', activityController.getActivitySubmissionsByTeacher);

// PUT to update a submission's score
router.put('/submissions/score/:submissionId', activityController.updateActivityScore);

// --- NEW: POST a new submission for an activity (save to MongoDB, no file upload) ---
router.post('/submit', async (req, res) => {
  try {
    const Submission = require('../models/Submission');
    const { activityId, studentId, content, submittedAt } = req.body;

    if (!activityId || !studentId || !content) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const submission = new Submission({
      activity: activityId,
      student: studentId,
      content, // text, link, or any data
      submittedAt: submittedAt || new Date(),
      status: 'Submitted'
    });

    await submission.save();
    res.status(201).json({ message: 'Submission saved!', submission });
  } catch (error) {
    console.error('Error saving submission:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// OPTIONS preflight for resubmit (CORS)
router.options('/resubmit/:id', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://capstone-admin-task-hub-jske.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// PUT to resubmit an activity (legacy, can be removed if not needed)
router.put('/resubmit/:id', activityController.resubmitActivity);

// PATCH to toggle lock/unlock an activity (must be before /:id routes)
router.patch('/:id/lock', activityController.toggleActivityLock);

// GET to download an activity attachment
router.get('/:id/download', activityController.downloadActivityAttachment);

// GET a single activity by its ID
router.get('/:id', activityController.getActivityById);

// PUT to update an activity
router.put('/:id', uploadActivity.single('attachment'), activityController.updateActivity);

// DELETE an activity
router.delete('/:id', activityController.deleteActivity);

module.exports = router;