const express = require('express');
const router = express.Router();
const { addTask, getTasks } = require('../controllers/taskController');
const multer = require('multer');

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Task routes
router.post('/:classId', upload.single('file'), addTask); // POST: Add a task to a class
router.get('/:classId', getTasks); // GET: Get all tasks for a class

module.exports = router;
