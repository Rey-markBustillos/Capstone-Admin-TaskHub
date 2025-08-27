const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const { ObjectId } = require('mongoose').Types;
const fetch = require('node-fetch');

// Generate quiz questions from module text using Ollama local AI
exports.generateQuiz = async (req, res) => {
  // Load API keys at runtime
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  console.log('[DEBUG] OPENROUTER_API_KEY (raw):', process.env.OPENROUTER_API_KEY);
  console.log('[DEBUG] OPENROUTER_API_KEY (used):', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.slice(0,12) + '...' : 'Missing');
  if (!OPENROUTER_API_KEY) {
    console.error('[ERROR] No OPENROUTER_API_KEY found in environment variables.');
  }
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
        console.log(`[DEBUG] [Batch ${i+1}/${numBatches}] Attempting OpenRouter API call with key:`, OPENROUTER_API_KEY.slice(0, 12) + '...');
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
        const rawText = await openrouterRes.text();
        if (!openrouterRes.ok) {
          console.error(`[ERROR] [Batch ${i+1}] OpenRouter API error:`, openrouterRes.status, rawText);
          // Extra debug info
          console.error('[DEBUG] OpenRouter API key used:', OPENROUTER_API_KEY);
          return res.status(500).json({ message: 'OpenRouter API error', status: openrouterRes.status, error: rawText, apiKey: OPENROUTER_API_KEY });
        }
        // Log the raw response for debugging
        console.log(`[DEBUG] [Batch ${i+1}] OpenRouter raw response:`, rawText);
        let data;
        try {
          data = JSON.parse(rawText);
        } catch (err) {
          console.error(`[ERROR] [Batch ${i+1}] Failed to parse OpenRouter response as JSON:`, rawText, err);
          return res.status(500).json({ message: 'OpenRouter response is not valid JSON', raw: rawText });
        }
        const message = data.choices?.[0]?.message;
        console.log(`[DEBUG] [Batch ${i+1}] OpenRouter assistant message:`, JSON.stringify(message, null, 2));
        let text = message?.content?.trim() || '';
        if (!text) {
          // No content returned, log reasoning if present
          const reasoning = message?.reasoning || '';
          console.error(`[ERROR] [Batch ${i+1}] No quiz questions found in content. Reasoning:`, reasoning);
          return res.status(500).json({ message: 'No quiz questions found in OpenRouter response.', reasoning });
        }
        // Remove markdown code fencing and extra lines
        if (text.startsWith('```')) {
          text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
        }
        // Attempt to fix incomplete/truncated JSON (remove trailing commas, close array)
        let fixedText = text;
        // Remove trailing commas before array/object close
        fixedText = fixedText.replace(/,\s*([}\]])/g, '$1');
        // If it looks like an array but is missing the closing bracket, add it
        if (fixedText.startsWith('[') && !fixedText.trim().endsWith(']')) {
          fixedText += ']';
        }
        try {
          questions = JSON.parse(fixedText);
        } catch (err) {
          console.error(`[ERROR] [Batch ${i+1}] Failed to parse OpenRouter response content as JSON:`, fixedText, err);
          return res.status(500).json({ message: 'AI response could not be parsed as JSON', raw: fixedText });
        }
      } else {
        console.error('[ERROR] No valid OpenRouter API key found. Please set OPENROUTER_API_KEY in your .env.');
        return res.status(500).json({ message: 'No valid OpenRouter API key found. Please set OPENROUTER_API_KEY in your .env.' });
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

  // (Removed duplicate legacy OpenRouter/DeepSeek logic)
};

// Save quiz
exports.createQuiz = async (req, res) => {
  try {
    const { classId, title, questions, createdBy, dueDate, questionTime } = req.body;
    // Map AI question types to schema types
    const typeMap = {
      'multiple_choice': 'mcq',
      'true_false': 'tf',
      'fill_in_the_blank': 'numeric',
      'numeric': 'numeric',
      'mcq': 'mcq',
      'tf': 'tf'
    };
    const mappedQuestions = (questions || []).map(q => ({
      type: typeMap[q.type] || 'mcq',
      question: q.question,
      options: q.options || [],
      answer: q.answer
    }));
    const quiz = await Quiz.create({ classId, title, questions: mappedQuestions, createdBy, dueDate, questionTime });
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get quizzes for a class
exports.getQuizzesByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || !ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid classId parameter.' });
    }
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
