const express = require('express');
const router = express.Router();
const { getClasses, addClass } = require('../controllers/classController');

router.get('/', getClasses);
router.post('/', addClass);

module.exports = router;
 