const express = require('express');
const router = express.Router();

const {
  getProfile,
  uploadProfile,
  deleteProfile,
  getAllProfiles
} = require('../controllers/profileController');

// GET /api/profiles - Get all profiles (admin only)
router.get('/', getAllProfiles);

// GET /api/profiles/:userId - Get user profile
router.get('/:userId', getProfile);

// POST /api/profiles/upload - Upload profile image
router.post('/upload', uploadProfile);

// DELETE /api/profiles/:userId - Delete user profile
router.delete('/:userId', deleteProfile);

module.exports = router;