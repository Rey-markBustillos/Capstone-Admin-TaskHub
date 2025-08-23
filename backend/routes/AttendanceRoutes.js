const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// POST /api/attendance/mark
router.post('/mark', attendanceController.markAttendance);

// GET /api/attendance/student/:id
router.get('/student/:id', attendanceController.getStudentAttendance);

// GET /api/attendance/class/:id
router.get('/class/:id', attendanceController.getClassAttendance);

module.exports = router;
