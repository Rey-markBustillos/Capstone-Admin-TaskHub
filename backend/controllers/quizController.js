const Quiz = require('../models/Quiz');
const { ObjectId } = require('mongoose').Types;
const fetch = require('node-fetch');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Generate quiz questions from module text using Ollama local AI
exports.generateQuiz = async (req, res) => {
  console.log('[DEBUG] /api/quizzes/generate called', { body: req.body });
  const { count = 3, moduleText } = req.body;
  const model = 'phi3';
  let prompt = '';
  if (moduleText && moduleText.trim()) {
    prompt = `Generate ${count} quiz questions (any type) based on this text. Respond as a JSON array of objects: type, question, options (array), answer.\nText:\n${moduleText}`;
  } else {
    prompt = `Generate ${count} quiz questions (any type) for a general subject. Respond as a JSON array of objects: type, question, options (array), answer.`;
  }

  try {
    if (OPENROUTER_API_KEY) {
      console.log('[DEBUG] Using OpenRouter API for quiz generation');
      const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [
            { role: 'system', content: 'You are a helpful quiz generator.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 8192,
          temperature: 0.7
        })
      });
      const data = await openrouterRes.json();
      console.log('[DEBUG] OpenRouter raw response:', JSON.stringify(data));
      let text = data.choices?.[0]?.message?.content?.trim() || '';
      if (text.startsWith('```')) text = text.replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
      let questions = [];
      try {
        questions = JSON.parse(text);
      } catch (err) {
        console.error('[ERROR] Failed to parse OpenRouter response:', text, err);
        return res.status(500).json({ message: 'AI response could not be parsed as JSON', raw: text });
      }
      return res.json({ questions });
    } else if (DEEPSEEK_API_KEY) {
      console.log('[DEBUG] Using DeepSeek API for quiz generation');
      const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful quiz generator.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 8192,
          temperature: 0.7
        })
      });
      const data = await deepseekRes.json();
      console.log('[DEBUG] DeepSeek raw response:', JSON.stringify(data));
      let text = data.choices?.[0]?.message?.content?.trim() || '';
      if (text.startsWith('```')) text = text.replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
      let questions = [];
      try {
        questions = JSON.parse(text);
      } catch (err) {
        console.error('[ERROR] Failed to parse DeepSeek response:', text, err);
        return res.status(500).json({ message: 'AI response could not be parsed as JSON', raw: text });
      }
      return res.json({ questions });
    } else {
      // Fallback to Ollama only if no API keys are present
      console.log('[DEBUG] Using Ollama for quiz generation');
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
      console.log('[DEBUG] Ollama raw response:', JSON.stringify(data));
      let questions = [];
      try {
        let text = data.response.trim();
        if (text.startsWith('```')) text = text.replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
        questions = JSON.parse(text);
      } catch (err) {
        console.error('[ERROR] Failed to parse Ollama response:', data.response, err);
        return res.status(500).json({ message: 'AI response could not be parsed as JSON', raw: data.response });
      }
      res.json({ questions });
    }
  } catch (err) {
    console.error('[ERROR] Failed to connect to AI provider:', err);
    res.status(500).json({ message: 'Failed to connect to AI provider', error: err.message, stack: err.stack });
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
