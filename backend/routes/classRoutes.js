const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');

router.get('/', classController.getClasses);
router.post('/', classController.addClass);
router.delete('/:id', classController.deleteClass);
router.put('/:id/add-students', classController.addStudentsToClass);

module.exports = router;