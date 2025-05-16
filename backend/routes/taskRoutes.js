const express = require('express');
const multer = require('multer');
const { addTask, getTasks, getTaskById } = require('../controllers/taskController');  // Import the correct controller methods
const router = express.Router();

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Store files in the "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);  // Unique filename
  }
});
const upload = multer({ storage: storage });

// POST /api/tasks/:classId - Add a task to a class
router.post('/:classId', upload.single('file'), addTask);

// GET /api/tasks/:classId - Get all tasks for a class
router.get('/:classId', getTasks);

// GET /api/tasks/task/:id - Get task details by task ID
router.get('/task/:id', getTaskById);

module.exports = router;
