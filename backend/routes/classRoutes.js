const express = require('express');
const router = express.Router();

const classController = require('../controllers/classController'); // <-- FIXED: import as classController

// Destructure all controller functions
const {
  getAllClasses,
  createClass,
  deleteClass,
  updateClassStudents,
  getClassById,
  updateClass,
  getClassesByStudent,
  archiveClass,
  restoreClass
} = classController;

// Get all classes (admin/teacher) or create class
router.route('/')
  .get(getAllClasses)
  .post(createClass);

// This must be registered before `/:id`; otherwise Express treats
// "my-classes" as a class ID and the student endpoint never runs.
router.get('/my-classes/:studentId', getClassesByStudent);

// Get, update, or delete a class by ID
router.route('/:id')
  .get(getClassById)
  .delete(deleteClass)
  .put(updateClass);

// Update students in a class
router.route('/:id/students')
  .put(updateClassStudents);

// Archive and restore class
router.put('/:id/archive', archiveClass);
router.put('/:id/restore', restoreClass);

module.exports = router;
