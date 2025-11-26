const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// --- Multer/Cloudinary Setup for Activity Attachments ---
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

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

// --- Routes ---
// GET all activities for a class
router.get('/', activityController.getActivities);

// POST create a new activity (with attachment upload)
router.post('/', uploadActivity.single('attachment'), activityController.createActivity);

/*
  >>> Put specific submission-related routes BEFORE the generic /:id route
  This prevents '/submission' being treated as ':id' (causes 404).
*/

// GET a single submission for a student and activity
router.get('/submission', activityController.getSubmissionForActivity);

// GET all submissions for a student in a class
router.get('/submissions', activityController.getSubmissionsForStudentInClass);

// GET submissions for a teacher to monitor
router.get('/submissions/teacher/:teacherId', activityController.getActivitySubmissionsByTeacher);

// GET to download a submission file (legacy)
router.get('/submission/:id/download', activityController.downloadSubmissionFile);

// DEBUG: Get submission file info (legacy)
router.get('/submission/:id/info', async (req, res) => {
  // ...existing code if needed...
});

// DELETE a submission by its ID (for students)
router.delete('/submission/:id', activityController.deleteSubmission);

// PUT to update a submission's score
router.put('/submissions/score/:submissionId', activityController.updateActivityScore);

// POST a new submission for an activity (save to MongoDB, no file upload)
router.post('/submit', activityController.submitActivity);

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

// GET a single activity by its ID (generic — keep it last)
router.get('/:id', activityController.getActivityById);

// PUT to update an activity
router.put('/:id', uploadActivity.single('attachment'), activityController.updateActivity);

// DELETE an activity
router.delete('/:id', activityController.deleteActivity);

module.exports = router;