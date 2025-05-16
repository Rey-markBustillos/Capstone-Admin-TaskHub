const express = require('express');
const { getClasses, addClass, deleteClass, addStudentToClass, getStudentsInClass } = require('../controllers/classController'); // Correctly import controller functions
const router = express.Router();

// GET /api/classes - Get all classes
router.get('/', getClasses);

// POST /api/classes - Add a new class
router.post('/', addClass);

// DELETE /api/classes/:id - Delete a class by ID
router.delete('/:id', deleteClass);

// POST /api/classes/:classId/addStudent - Add a student to a class
router.post('/:classId/addStudent', addStudentToClass);

// GET /api/classes/:classId/students - Get all students in a class
router.get('/:classId/students', getStudentsInClass);

module.exports = router;
