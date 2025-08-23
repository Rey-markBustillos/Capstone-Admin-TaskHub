const Quiz = require('../models/Quiz');
const { ObjectId } = require('mongoose').Types;

// Generate quiz questions from module text (MVP: dummy logic)
exports.generateQuiz = async (req, res) => {
  const { moduleText } = req.body;
  if (!moduleText) return res.status(400).json({ message: 'Module text required' });
  // Dummy: generate 1 MCQ, 1 TF, 1 Numeric
  const questions = [
    {
      type: 'mcq',
      question: 'What is the main topic of the module?',
      options: ['A', 'B', 'C', 'D'],
      answer: 'A',
    },
    {
      type: 'tf',
      question: 'The module is about science. (T/F)',
      options: ['True', 'False'],
      answer: 'True',
    },
    {
      type: 'numeric',
      question: 'How many sections are in the module?',
      options: [],
      answer: 3,
    },
  ];
  res.json({ questions });
};

// Save quiz
exports.createQuiz = async (req, res) => {
  try {
    const { classId, title, questions, createdBy } = req.body;
    const quiz = await Quiz.create({ classId, title, questions, createdBy });
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get quizzes for a class
exports.getQuizzesByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const quizzes = await Quiz.find({ classId: ObjectId(classId) });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Edit quiz
exports.updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title, questions } = req.body;
    const quiz = await Quiz.findByIdAndUpdate(quizId, { title, questions }, { new: true });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    await Quiz.findByIdAndDelete(quizId);
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
