const express = require('express');
const router = express.Router();

const {
  getUsers,
  createUser,
  updateUser,
  toggleActiveStatus,
  deleteUser,
  addStudent,
} = require('../controllers/userController');

// Get all users
router.get('/', getUsers);

// Create new user
router.post('/', createUser);

// Update user
router.put('/:id', updateUser);

// Toggle active status
router.patch('/:id/toggle', toggleActiveStatus);

// Delete user
router.delete('/:id', deleteUser);

// Add student to a user
router.post('/add-student', addStudent);

module.exports = router;
