// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Example GET route
router.get('/', (req, res) => {
  res.json({ message: 'User route is working!' });
});

module.exports = router;
