const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const { ObjectId } = require('mongoose').Types;
const fetch = require('node-fetch');

// Generate quiz questions from module text using Ollama local AI
exports.generateQuiz = async (req, res) => {
  // Load API keys at runtime
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  console.log('[DEBUG] OPENROUTER_API_KEY:', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.slice(0,8) + '...' : 'Missing');
  console.log('[DEBUG] DEEPSEEK_API_KEY:', DEEPSEEK_API_KEY ? DEEPSEEK_API_KEY.slice(0,8) + '...' : 'Missing');
  console.log('[DEBUG] /api/quizzes/generate called', { body: req.body });
  const { count = 3, moduleText, quizType } = req.body;
  const model = 'phi3';
  // Batching logic: max 10 per API call for reliability
  const batchSize = 10;
  const numBatches = Math.ceil(count / batchSize);
  let allQuestions = [];
  for (let i = 0; i < numBatches; i++) {
    // Compute how many questions for this batch
    const batchCount = (i === numBatches - 1) ? (count - i * batchSize) : batchSize;
    let prompt = '';
    let typePrompt = '';
  if (quizType === 'mcq') typePrompt = 'multiple choice';
  else if (quizType === 'true_false') typePrompt = 'true or false';
  else if (quizType === 'identification') typePrompt = 'identification';
  else typePrompt = 'mixed types';
    if (moduleText && moduleText.trim()) {
      prompt = `Generate ${batchCount} quiz questions (${typePrompt}) based on this text. Respond as a JSON array of objects: type, question, options (array), answer.\nText:\n${moduleText}`;
    } else {
      prompt = `Generate ${batchCount} quiz questions (${typePrompt}) for a general subject. Respond as a JSON array of objects: type, question, options (array), answer.`;
    }
    try {
      let questions = [];
      if (OPENROUTER_API_KEY) {
        console.log(`[DEBUG] [Batch ${i+1}/${numBatches}] Attempting OpenRouter API call...`);
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
            max_tokens: 1024,
            temperature: 0.7
          })
        });
        if (!openrouterRes.ok) {
          const errorText = await openrouterRes.text();
          console.error(`[ERROR] [Batch ${i+1}] OpenRouter API error:`, openrouterRes.status, errorText);
          return res.status(500).json({ message: 'OpenRouter API error', status: openrouterRes.status, error: errorText });
        }
        const data = await openrouterRes.json();
        let text = data.choices?.[0]?.message?.content?.trim() || '';
        if (text.startsWith('```')) text = text.replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
        try {
          questions = JSON.parse(text);
        } catch (err) {
          console.error(`[ERROR] [Batch ${i+1}] Failed to parse OpenRouter response:`, text, err);
          return res.status(500).json({ message: 'AI response could not be parsed as JSON', raw: text });
        }
      } else if (DEEPSEEK_API_KEY) {
        console.log(`[DEBUG] [Batch ${i+1}/${numBatches}] Attempting DeepSeek API call...`);
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
            max_tokens: 1024,
            temperature: 0.7
          })
        });
        if (!deepseekRes.ok) {
          const errorText = await deepseekRes.text();
          console.error(`[ERROR] [Batch ${i+1}] DeepSeek API error:`, deepseekRes.status, errorText);
          return res.status(500).json({ message: 'DeepSeek API error', status: deepseekRes.status, error: errorText });
        }
        const data = await deepseekRes.json();
        let text = data.choices?.[0]?.message?.content?.trim() || '';
        if (text.startsWith('```')) text = text.replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
        try {
          questions = JSON.parse(text);
        } catch (err) {
          console.error(`[ERROR] [Batch ${i+1}] Failed to parse DeepSeek response:`, text, err);
          return res.status(500).json({ message: 'AI response could not be parsed as JSON', raw: text });
        }
      } else {
        return res.status(500).json({ message: 'No valid AI provider API key found. Please set OPENROUTER_API_KEY or DEEPSEEK_API_KEY in your .env.' });
      }
      if (Array.isArray(questions)) {
        allQuestions = allQuestions.concat(questions);
      }
    } catch (err) {
      console.error(`[ERROR] [Batch ${i+1}] Failed to connect to AI provider:`, err);
      return res.status(500).json({ message: 'Failed to connect to AI provider', error: err.message, stack: err.stack });
    }
  }
  // Post-process: relabel options as A, B, C, D, ... for multiple choice
  const labeledQuestions = allQuestions.slice(0, count).map(q => {
    // Normalize type for MCQ
    let type = q.type;
    if (q.type === 'multiple_choice') type = 'mcq';
    let displayType = 'Identification';
    if (type === 'mcq') displayType = 'Multiple Choice';
    else if (type === 'true/false' || type === 'true_false' || type === 'tf') displayType = 'True or False';
    if (type === 'mcq' && Array.isArray(q.options)) {
      const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const labeledOptions = q.options.map((opt, idx) => `${labels[idx]}. ${opt}`);
      // Try to match answer to new label
      let answerLabel = '';
      const answerIdx = q.options.findIndex(opt => opt === q.answer);
      if (answerIdx !== -1 && answerIdx < labels.length) {
        answerLabel = labels[answerIdx];
      }
      return {
        ...q,
        type,
        displayType,
        options: labeledOptions,
        answer: answerLabel || q.answer
      };
    }
    return { ...q, type, displayType };
  });
  return res.json({ questions: labeledQuestions });

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
          max_tokens: 2048,
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
          max_tokens: 2048,
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
    const { classId, title, questions, createdBy, dueDate, questionTime } = req.body;
    const quiz = await Quiz.create({ classId, title, questions, createdBy, dueDate, questionTime });
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

// Get all submissions for a quiz (teacher view)
exports.getQuizSubmissions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const submissions = await QuizSubmission.find({ quizId }).populate('studentId', 'name email');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
