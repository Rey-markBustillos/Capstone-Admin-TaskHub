const Quiz = require('../models/Quiz');
const { ObjectId } = require('mongoose').Types;

// Generate quiz questions from module text using Ollama local AI
const fetch = require('node-fetch');
exports.generateQuiz = async (req, res) => {
  const { count = 3, moduleText } = req.body; // Lower default for speed
  // Use a faster model if available (e.g., phi3 or llama2:7b)
  const model = 'phi3';
  // Simplified prompt for speed
  let prompt = '';
  if (moduleText && moduleText.trim()) {
    prompt = `Generate ${count} quiz questions (any type) based on this text. Respond as a JSON array of objects: type, question, options (array), answer.\nText:\n${moduleText}`;
  } else {
    prompt = `Generate ${count} quiz questions (any type) for a general subject. Respond as a JSON array of objects: type, question, options (array), answer.`;
  }

  try {
    const ollamaRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });
    const data = await ollamaRes.json();
    // Try to parse the response as JSON array
    let questions = [];
    try {
      // Some models may wrap the JSON in markdown code block
      let text = data.response.trim();
      if (text.startsWith('```')) text = text.replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
      questions = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({ message: 'AI response could not be parsed as JSON', raw: data.response });
    }
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to connect to Ollama', error: err.message });
  }
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
