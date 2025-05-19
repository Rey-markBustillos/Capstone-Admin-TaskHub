// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { getStats, getNotifications } = require('../controllers/teacherController');

router.get('/stats', getStats);
router.get('/notifications', getNotifications);

module.exports = router;
