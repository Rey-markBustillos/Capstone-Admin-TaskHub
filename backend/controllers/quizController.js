// Student submits quiz answers
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { studentId, answers } = req.body;
    // Fetch the quiz to get correct answers
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    // Prevent duplicate submissions
    const existing = await QuizSubmission.findOne({ quizId, studentId });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted this quiz.' });
    }
    // Calculate score
    let score = 0;
    if (Array.isArray(answers) && Array.isArray(quiz.questions)) {
      for (let i = 0; i < quiz.questions.length; i++) {
        const submitted = answers.find(a => a.questionIndex === i);
        if (submitted && submitted.answer !== undefined) {
          // Accept string or boolean answers
          const correct = quiz.questions[i].answer;
          if (String(submitted.answer).trim().toLowerCase() === String(correct).trim().toLowerCase()) {
            score++;
          }
        }
      }
    }
    // Save submission
    const submission = new QuizSubmission({
      quizId,
      studentId,
      answers,
      score,
      submittedAt: new Date(),
    });
    await submission.save();
    res.json({ message: 'Quiz submitted successfully', score });
  } catch (err) {
    console.error('[ERROR] Quiz submission failed:', err);
    res.status(500).json({ message: 'Quiz submission failed', error: err.message });
  }
};
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const { ObjectId } = require('mongoose').Types;
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Generate quiz questions from module text using Ollama local AI
exports.generateQuiz = async (req, res) => {
  // Load Gemini API key at runtime
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  console.log('[DEBUG] GEMINI_API_KEY (raw):', process.env.GEMINI_API_KEY);
  if (!GEMINI_API_KEY) {
    console.error('[ERROR] No GEMINI_API_KEY found in environment variables.');
    return res.status(500).json({ message: 'No GEMINI_API_KEY found in environment variables.' });
  }
  console.log('[DEBUG] /api/quizzes/generate called', { body: req.body });
  const { count = 3, moduleText, quizType } = req.body;
  // Batching logic: max 10 per API call for reliability
  const batchSize = 10;
  const numBatches = Math.ceil(count / batchSize);
  let allQuestions = [];
  // Initialize Gemini SDK
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });
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
      // Gemini SDK call
      console.log(`[DEBUG] [Batch ${i+1}/${numBatches}] Using Gemini SDK`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if (!text) {
        console.error(`[ERROR] [Batch ${i+1}] No quiz questions found in Gemini SDK response.`);
        return res.status(500).json({ message: 'No quiz questions found in Gemini SDK response.' });
      }
      // Remove markdown code fencing and extra lines
      if (text.startsWith('```')) {
        text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
      }
      // Attempt to fix incomplete/truncated JSON (remove trailing commas, close array)
      let fixedText = text;
      fixedText = fixedText.replace(/,\s*([}\]])/g, '$1');
      if (fixedText.startsWith('[') && !fixedText.trim().endsWith(']')) {
        fixedText += ']';
      }
      try {
        questions = JSON.parse(fixedText);
      } catch (err) {
        console.error(`[ERROR] [Batch ${i+1}] Failed to parse Gemini SDK response content as JSON:`, fixedText, err);
        return res.status(500).json({ message: 'AI response could not be parsed as JSON', raw: fixedText });
      }
      if (Array.isArray(questions)) {
        allQuestions = allQuestions.concat(questions);
      }
    } catch (err) {
      console.error(`[ERROR] [Batch ${i+1}] Gemini SDK error:`, err);
      return res.status(500).json({ message: 'Gemini SDK error', error: err.message, stack: err.stack });
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
    const { studentId } = req.query;
    console.log('[DEBUG] getQuizzesByClass called with classId:', classId, 'studentId:', studentId);
    if (!classId || !ObjectId.isValid(classId)) {
      console.error('[ERROR] Invalid classId parameter:', classId);
      return res.status(400).json({ message: 'Invalid classId parameter.' });
    }
    let quizzes = [];
    try {
      quizzes = await Quiz.find({ classId: ObjectId(classId) });
    } catch (objErr) {
      console.error('[ERROR] ObjectId conversion failed, trying string match:', objErr);
      quizzes = await Quiz.find({ classId: classId });
    }
    // Attach submissions for each quiz (optionally filter by studentId)
    const quizIds = quizzes.map(q => q._id);
    let submissions = await QuizSubmission.find({ quizId: { $in: quizIds } });
    if (studentId) {
      submissions = submissions.filter(sub => String(sub.studentId) === String(studentId));
    }
    const quizzesWithSubs = quizzes.map(q => {
      const subs = submissions.filter(sub => String(sub.quizId) === String(q._id));
      return { ...q.toObject(), submissions: subs };
    });
    res.json(quizzesWithSubs);
  } catch (err) {
    console.error('[ERROR] getQuizzesByClass failed:', err);
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
    console.log('[DEBUG] Returning quiz submissions:', submissions.map(s => ({ id: s._id, student: s.studentId, score: s.score, submittedAt: s.submittedAt })));
    res.json(submissions);
  } catch (err) {
    console.error('[ERROR] getQuizSubmissions:', err);
    res.status(500).json({ message: err.message });
  }
};
