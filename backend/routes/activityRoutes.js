const express = require('express');
const multer = require('multer');
const path = require('path');
const { createActivity, getActivitiesByClass } = require('../controllers/activityController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/', upload.single('attachedFile'), createActivity);
router.get('/', getActivitiesByClass);

module.exports = router;
