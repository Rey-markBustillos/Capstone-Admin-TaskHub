const express = require('express');
const router = express.Router();
const { getClasses, addClass, deleteClass } = require('../controllers/classController');

router.get('/', getClasses);
router.post('/', addClass);
router.delete('/:id', deleteClass); // ✅ New route for deleting

module.exports = router;
