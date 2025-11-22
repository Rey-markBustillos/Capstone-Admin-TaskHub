const express = require('express');
const router = express.Router();
const {
  recordVisit,
  getTotalVisits,
  getVisitsByPage,
  getVisitStatistics,
  getDailyActiveUsers
} = require('../controllers/visitController');

// POST /api/visits - Record a new visit
router.post('/', recordVisit);

// GET /api/visits/total - Get total visits count
router.get('/total', getTotalVisits);

// GET /api/visits/page/:page - Get visits for specific page
router.get('/page/:page', getVisitsByPage);

// GET /api/visits/statistics - Get comprehensive visit statistics
router.get('/statistics', getVisitStatistics);

// GET /api/visits/daily-active-users - Get daily active users chart data
router.get('/daily-active-users', getDailyActiveUsers);

module.exports = router;