const express = require('express');
const router = express.Router();

const {
  getClasses,
  addClass,
  deleteClass,
  addStudentsToClass,
} = require('../controllers/classController');

// GET all classes
router.get('/', getClasses);

// POST add new class
router.post('/', addClass);

// DELETE a class by ID
router.delete('/:id', deleteClass);

// PUT add students to class
router.put('/:id/add-students', addStudentsToClass);

module.exports = router;
