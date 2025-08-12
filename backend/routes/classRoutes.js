const express = require('express');
const router = express.Router();

// AYOS: I-destructure ang mga tamang function mula sa inayos na controller
const {
  getAllClasses,
  createClass,
  deleteClass,
  updateClassStudents,
  getClassById,
} = require('../controllers/classController');

// Route para sa pagkuha ng lahat ng klase at paggawa ng bago
router.route('/')
  .get(getAllClasses)   // Dati ay 'getClasses', ngayon ay 'getAllClasses' na
  .post(createClass);   // Dati ay 'addClass', ngayon ay 'createClass' na

// Route para sa isang specific na klase by ID
router.route('/:id')
  .get(getClassById)
  .delete(deleteClass);

// Route para sa pag-update ng mga estudyante sa isang klase
router.route('/:id/students')
  .put(updateClassStudents);

module.exports = router;