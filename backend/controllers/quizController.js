const Quiz = require('../models/Quiz');
const { ObjectId } = require('mongoose').Types;
const fetch = require('node-fetch');


// Generate quiz questions from module text using Ollama local AI
exports.generateQuiz = async (req, res) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  console.log('[DEBUG] OPENROUTER_API_KEY:', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.slice(0,8) + '...' : 'Missing');
  console.log('[DEBUG] DEEPSEEK_API_KEY:', DEEPSEEK_API_KEY ? DEEPSEEK_API_KEY.slice(0,8) + '...' : 'Missing');
  console.log('[DEBUG] OPENROUTER_API_KEY:', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.slice(0,8) + '...' : 'Missing');
  console.log('[DEBUG] DEEPSEEK_API_KEY:', DEEPSEEK_API_KEY ? DEEPSEEK_API_KEY.slice(0,8) + '...' : 'Missing');
  console.log('[DEBUG] /api/quizzes/generate called', { body: req.body });
  const { count = 3, moduleText } = req.body;
  const model = 'phi3';
  let prompt = '';
  if (moduleText && moduleText.trim()) {
    prompt = `Generate ${count} multiple-choice quiz questions based on this text. Each question must have 4 or more options, labeled as A, B, C, D, etc. Respond as a JSON array of objects with the following fields: type (always 'multiple_choice'), question, options (array of strings, each starting with its label, e.g., 'A. ...', 'B. ...'), and answer (the letter of the correct option, e.g., 'A', 'B', 'C', or 'D').\nText:\n${moduleText}`;
  } else {
    prompt = `Generate ${count} multiple-choice quiz questions for a general subject. Each question must have 4 or more options, labeled as A, B, C, D, etc. Respond as a JSON array of objects with the following fields: type (always 'multiple_choice'), question, options (array of strings, each starting with its label, e.g., 'A. ...', 'B. ...'), and answer (the letter of the correct option, e.g., 'A', 'B', 'C', or 'D').`;
  }

  try {
    if (OPENROUTER_API_KEY) {
      console.log('[DEBUG] Attempting OpenRouter API call...');
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
          max_tokens: 2000,
          temperature: 0.7
        })
      });
      if (!openrouterRes.ok) {
        const errorText = await openrouterRes.text();
        console.error('[ERROR] OpenRouter API error:', openrouterRes.status, errorText);
        return res.status(500).json({ message: 'OpenRouter API error', status: openrouterRes.status, error: errorText });
      }
      const data = await openrouterRes.json();
      console.log('[DEBUG] OpenRouter raw response:', JSON.stringify(data));
      let text = data.choices?.[0]?.message?.content?.trim() || '';
      if (text.startsWith('```')) text = text.replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
      let questions = [];
      try {
        questions = JSON.parse(text);
        // Post-process: ensure MCQ format with choices A, B, C, D
        questions = questions.filter(q =>
          q && Array.isArray(q.options) && q.options.length >= 4 &&
          q.options.every(opt => /^[A-D]\.\s/.test(opt)) &&
          typeof q.answer === 'string' && /^[A-D]$/.test(q.answer.trim())
        );
      } catch (err) {
        console.error('[ERROR] Failed to parse OpenRouter response:', text, err);
        return res.status(500).json({ message: 'AI response could not be parsed as JSON', raw: text });
      }
      return res.json({ questions });
    } else if (DEEPSEEK_API_KEY) {
      console.log('[DEBUG] Attempting DeepSeek API call...');
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
          max_tokens: 2000,
          temperature: 0.7
        })
      });
      if (!deepseekRes.ok) {
        const errorText = await deepseekRes.text();
        console.error('[ERROR] DeepSeek API error:', deepseekRes.status, errorText);
        return res.status(500).json({ message: 'DeepSeek API error', status: deepseekRes.status, error: errorText });
      }
      const data = await deepseekRes.json();
      console.log('[DEBUG] DeepSeek raw response:', JSON.stringify(data));
      let text = data.choices?.[0]?.message?.content?.trim() || '';
      if (text.startsWith('```')) text = text.replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
      let questions = [];
      try {
        questions = JSON.parse(text);
        // Post-process: ensure MCQ format with choices A, B, C, D
        questions = questions.filter(q =>
          q && Array.isArray(q.options) && q.options.length >= 4 &&
          q.options.every(opt => /^[A-D]\.\s/.test(opt)) &&
          typeof q.answer === 'string' && /^[A-D]$/.test(q.answer.trim())
        );
      } catch (err) {
        console.error('[ERROR] Failed to parse DeepSeek response:', text, err);
        return res.status(500).json({ message: 'AI response could not be parsed as JSON', raw: text });
      }
      return res.json({ questions });
    } else {
      // No valid AI provider available
      return res.status(500).json({ message: 'No valid AI provider API key found. Please set OPENROUTER_API_KEY or DEEPSEEK_API_KEY in your .env.' });
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
