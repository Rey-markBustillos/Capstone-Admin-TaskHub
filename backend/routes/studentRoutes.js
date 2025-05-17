const express = require("express");
const router = express.Router();
const { getStudents } = require("../controllers/studentController");

// GET /api/students - get all users with role 'student'
router.get("/", getStudents);

module.exports = router;
