const express = require('express');
const router = express.Router();

const {
  getUsers,
  createUser,
  updateUser,
  toggleActiveStatus,
  deleteUser,
  addStudent,
  loginUser,
  uploadProfile,
  getProfileImage,
} = require('../controllers/userController-mock');

// Get all users
router.get('/', getUsers);

// Create a new user
router.post('/', createUser);

// User login
router.post('/login', loginUser);

// Update a user by ID
router.put('/:id', updateUser);

// Toggle user active status by ID
router.patch('/:id/toggle', toggleActiveStatus);

// Delete a user by ID
router.delete('/:id', deleteUser);

// Add a student to a user
router.post('/add-student', addStudent);

// Profile image upload (teachers and admins only)
router.post('/upload-profile', uploadProfile);

// Get user profile image
router.get('/profile-image/:userId', getProfileImage);

module.exports = router;