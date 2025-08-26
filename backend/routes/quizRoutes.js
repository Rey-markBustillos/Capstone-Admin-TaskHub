const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Generate quiz from module text
router.post('/generate', (req, res, next) => {
	console.log('[Route] /api/quizzes/generate endpoint hit', req.body);
	next();
}, quizController.generateQuiz);
// Create quiz
router.post('/', quizController.createQuiz);
// Get quizzes for a class
router.get('/class/:classId', quizController.getQuizzesByClass);
// Update quiz
router.put('/:quizId', quizController.updateQuiz);
// Delete quiz
router.delete('/:quizId', quizController.deleteQuiz);

module.exports = router;
