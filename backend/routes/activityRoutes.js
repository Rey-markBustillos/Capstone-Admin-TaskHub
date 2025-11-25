const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Configuration ---

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

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

const fileFilter = (req, file, cb) => {
  cb(null, true); 
};

const uploadActivity = multer({
  storage: activityStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

const uploadSubmission = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

// --- Routes ---

// GET all activities for a class
router.get('/', activityController.getActivities);

// POST create a new activity
router.post('/', uploadActivity.single('attachment'), activityController.createActivity);

// GET a single submission for a student and activity
router.get('/submission', activityController.getSubmissionForActivity);

// GET to download a submission file
router.get('/submission/:id/download', activityController.downloadSubmissionFile);

// GET to serve submission file directly (alternative route)
router.get('/submission/:id/file', async (req, res) => {
  try {
    const { id } = req.params;
    const Submission = require('../models/Submission');
    
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }

    const submission = await Submission.findById(id);
    if (!submission || !submission.filePath) {
      return res.status(404).json({ message: 'Submission file not found.' });
    }

    let filePath;
    if (submission.filePath.startsWith('uploads/')) {
      filePath = path.join(__dirname, '..', submission.filePath);
    } else if (submission.filePath.startsWith('./uploads/')) {
      filePath = path.join(__dirname, '..', submission.filePath.substring(2));
    } else {
      filePath = path.join(__dirname, '..', 'uploads', 'submissions', submission.filePath);
    }

    console.log('Serving file:', filePath);
    console.log('File exists:', require('fs').existsSync(filePath));

    if (require('fs').existsSync(filePath)) {
      const mimeType = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.zip': 'application/zip'
      };
      
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeType[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${submission.fileName || path.basename(filePath)}"`);
      
      const fileStream = require('fs').createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      res.status(404).json({ message: 'Physical file not found on server.' });
    }
  } catch (error) {
    console.error('Error serving submission file:', error);
    res.status(500).json({ message: 'Error serving file', error: error.message });
  }
});

// DEBUG: List files in uploads directory
router.get('/debug/uploads', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const submissionsDir = path.join(uploadsDir, 'submissions');
    
    const result = {
      uploadsExists: require('fs').existsSync(uploadsDir),
      submissionsExists: require('fs').existsSync(submissionsDir),
      files: {
        uploads: [],
        submissions: []
      }
    };
    
    if (result.uploadsExists) {
      try {
        result.files.uploads = require('fs').readdirSync(uploadsDir);
      } catch (e) {
        result.files.uploads = [`Error reading: ${e.message}`];
      }
    }
    
    if (result.submissionsExists) {
      try {
        result.files.submissions = require('fs').readdirSync(submissionsDir);
      } catch (e) {
        result.files.submissions = [`Error reading: ${e.message}`];
      }
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Get submission file info
router.get('/submission/:id/info', async (req, res) => {
  try {
    const { id } = req.params;
    const Submission = require('../models/Submission');
    const submission = await Submission.findById(id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submissionsDir = path.join(__dirname, '..', 'uploads', 'submissions');
    const files = fs.readdirSync(submissionsDir).filter(file => 
      file.includes(submission.fileName?.split('.')[0] || 'submission')
    );

    res.json({
      submission: {
        id: submission._id,
        filePath: submission.filePath,
        fileName: submission.fileName
      },
      submissionsDirectory: submissionsDir,
      filesInDirectory: files,
      directoryExists: fs.existsSync(submissionsDir)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

// POST a new submission for an activity
router.post('/submit', uploadSubmission.single('file'), activityController.submitActivity);

// OPTIONS preflight for resubmit (CORS)
router.options('/resubmit/:id', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://capstone-admin-task-hub-jske.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});
// PUT to resubmit an activity
router.put('/resubmit/:id', uploadSubmission.single('file'), activityController.resubmitActivity);

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