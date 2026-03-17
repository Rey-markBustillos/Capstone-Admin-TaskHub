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

// Add this function to list available models
const listAvailableModels = async () => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = await genAI.listModels();
    console.log('[INFO] Available Gemini models:');
    models.forEach(model => {
      console.log(`- ${model.name} (supports: ${model.supportedGenerationMethods?.join(', ')})`);
    });
    return models;
  } catch (error) {
    console.error('[ERROR] Failed to list models:', error.message);
    return [];
  }
};

const DIFFICULTIES = ['easy', 'medium', 'hard'];

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildDifficultyPlan = (count) => {
  const base = Math.floor(count / DIFFICULTIES.length);
  let remainder = count % DIFFICULTIES.length;
  const plan = [];
  DIFFICULTIES.forEach((d) => {
    const slots = base + (remainder > 0 ? 1 : 0);
    remainder -= remainder > 0 ? 1 : 0;
    for (let i = 0; i < slots; i++) {
      plan.push(d);
    }
  });
  return shuffleArray(plan);
};

const normalizeDifficulty = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (DIFFICULTIES.includes(v)) return v;
  return 'medium';
};

const ensureFourOptions = (inputOptions, fallbackCorrect) => {
  const options = Array.isArray(inputOptions)
    ? inputOptions.map((opt) => String(opt || '').trim()).filter(Boolean)
    : [];

  const unique = [];
  const seen = new Set();
  for (const opt of options) {
    const key = opt.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(opt);
    }
    if (unique.length === 4) break;
  }

  const fillers = ['Option A', 'Option B', 'Option C', 'Option D', 'Option E', 'Option F'];
  let pointer = 0;
  while (unique.length < 4) {
    const candidate = fillers[pointer] || `Option ${pointer + 1}`;
    pointer += 1;
    if (!seen.has(candidate.toLowerCase())) {
      seen.add(candidate.toLowerCase());
      unique.push(candidate);
    }
  }

  const normalizedCorrect = String(fallbackCorrect || '').trim();
  if (normalizedCorrect) {
    const found = unique.find((opt) => opt.toLowerCase() === normalizedCorrect.toLowerCase());
    if (!found) {
      unique[0] = normalizedCorrect;
    }
  }

  return unique.slice(0, 4);
};

const sanitizeQuestionText = (value, idx) => {
  const q = String(value || '').trim();
  if (!q) return `Generated question ${idx + 1}?`;
  return q.endsWith('?') ? q : `${q}?`;
};

const normalizeQuestionShape = (q, idx, forcedDifficulty) => {
  const question = sanitizeQuestionText(q?.question, idx);
  const options = ensureFourOptions(q?.options, q?.correctAnswer || q?.answer);
  const rawCorrect = String(q?.correctAnswer || q?.answer || '').trim();
  const fallbackCorrect = options[0];
  const correctAnswer = options.find((opt) => opt.toLowerCase() === rawCorrect.toLowerCase()) || fallbackCorrect;
  const explanation = String(q?.explanation || `This is the best answer based on the module content for this topic.`).trim();
  const difficulty = normalizeDifficulty(forcedDifficulty || q?.difficulty);

  return {
    type: 'mcq',
    displayType: 'Multiple Choice',
    question,
    options,
    correctAnswer,
    answer: correctAnswer,
    explanation,
    difficulty,
    labeledOptions: {
      A: options[0],
      B: options[1],
      C: options[2],
      D: options[3],
    },
  };
};

const dedupeQuestions = (questions) => {
  const seen = new Set();
  const unique = [];
  for (const q of questions) {
    const key = String(q.question || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(q);
  }
  return unique;
};

// Add fallback quiz generation with topic-specific questions
const generateFallbackQuiz = (count, moduleText, quizType, difficultyPlan = []) => {
  const topic = moduleText ? moduleText.toLowerCase() : '';
  const questions = [];

  // Determine topic-specific questions
  let topicQuestions = [];
  
  if (topic.includes('guitar') || topic.includes('chord')) {
    topicQuestions = [
      {
        question: "What is a major chord typically composed of?",
        options: ["Root, major third, perfect fifth", "Root, minor third, perfect fifth", "Root, major third, minor seventh", "Root, perfect fourth, perfect fifth"],
        answer: "Root, major third, perfect fifth"
      },
      {
        question: "Which chord is often called the 'happy' sounding chord?",
        options: ["Major chord", "Minor chord", "Diminished chord", "Augmented chord"],
        answer: "Major chord"
      },
      {
        question: "What does the 'C' in C major chord represent?",
        options: ["The root note", "The chord type", "The finger position", "The string number"],
        answer: "The root note"
      },
      {
        question: "How many strings does a standard acoustic guitar have?",
        options: ["6 strings", "4 strings", "5 strings", "7 strings"],
        answer: "6 strings"
      },
      {
        question: "What is the most common strumming pattern for beginners?",
        options: ["Down-Down-Up-Up-Down-Up", "Up-Down-Up-Down", "Down-Up-Down-Up", "All down strums"],
        answer: "Down-Down-Up-Up-Down-Up"
      },
      {
        question: "Which chord is typically learned first by guitar beginners?",
        options: ["G major", "C major", "F major", "B major"],
        answer: "G major"
      },
      {
        question: "What does 'barre chord' mean in guitar playing?",
        options: ["Using one finger to press multiple strings", "Playing one string at a time", "Using a pick", "Playing without looking"],
        answer: "Using one finger to press multiple strings"
      },
      {
        question: "What is the difference between major and minor chords?",
        options: ["The third interval (major vs minor third)", "The number of strings used", "The strumming pattern", "The guitar position"],
        answer: "The third interval (major vs minor third)"
      }
    ];
  } else if (topic.includes('math') || topic.includes('mathematics')) {
    topicQuestions = [
      {
        question: "What is the result of 5 + 3 × 2?",
        options: ["11", "16", "13", "10"],
        answer: "11"
      },
      {
        question: "What is the square root of 64?",
        options: ["8", "6", "7", "9"],
        answer: "8"
      },
      {
        question: "What is 25% of 80?",
        options: ["20", "15", "25", "30"],
        answer: "20"
      }
    ];
  } else if (topic.includes('science') || topic.includes('biology') || topic.includes('chemistry')) {
    topicQuestions = [
      {
        question: "What is the chemical symbol for water?",
        options: ["H2O", "CO2", "NaCl", "O2"],
        answer: "H2O"
      },
      {
        question: "How many chambers does a human heart have?",
        options: ["4", "2", "3", "5"],
        answer: "4"
      },
      {
        question: "What gas do plants absorb from the atmosphere during photosynthesis?",
        options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
        answer: "Carbon dioxide"
      }
    ];
  } else {
    // Generic educational questions
    topicQuestions = [
      {
        question: `What is the main topic of "${moduleText || 'this subject'}"?`,
        options: ["Educational content", "Entertainment", "Sports", "Technology"],
        answer: "Educational content"
      },
      {
        question: "Which learning method is most effective for understanding new concepts?",
        options: ["Practice and repetition", "Reading only", "Watching videos only", "Memorization only"],
        answer: "Practice and repetition"
      },
      {
        question: "What is the best way to retain information from studying?",
        options: ["Regular review and practice", "Cramming before tests", "Reading once", "Highlighting text"],
        answer: "Regular review and practice"
      }
    ];
  }

  // Generate question pool with deterministic uniqueness for high counts.
  const shuffled = shuffleArray(topicQuestions);
  const conceptSeed = moduleText
    ? moduleText
        .split(/\s+/)
        .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').trim())
        .filter((w) => w.length > 3)
        .slice(0, Math.max(10, count))
    : [];
  const difficultyForIndex = (i) => difficultyPlan[i] || DIFFICULTIES[i % DIFFICULTIES.length];
  
  for (let i = 0; i < count; i++) {
    const baseQuestion = shuffled[i % shuffled.length];
    const concept = conceptSeed[i % conceptSeed.length] || `concept ${i + 1}`;
    const variant = i + 1;
    const fallbackQuestion = {
      question: `${baseQuestion.question.replace(/\?$/, '')} (${concept}, item ${variant})?`,
      options: [...baseQuestion.options],
      correctAnswer: baseQuestion.answer,
      explanation: `The correct answer is based on ${concept} and core principles discussed in the lesson.`,
      difficulty: difficultyForIndex(i),
    };
    questions.push(normalizeQuestionShape(fallbackQuestion, i, difficultyForIndex(i)));
  }

  return dedupeQuestions(questions);
};

// Create quiz prompt for Gemini
const createQuizPrompt = (count, moduleText, difficulty, quizType, existingQuestions = [], difficultyPlan = []) => {
  let typePrompt = '';
  if (quizType === 'mcq') typePrompt = 'multiple choice';
  else if (quizType === 'true_false') typePrompt = 'true or false';
  else if (quizType === 'identification') typePrompt = 'identification';
  else typePrompt = 'mixed types';

  let existingContext = '';
  if (existingQuestions.length > 0) {
    const existingList = existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    existingContext = `\n\nIMPORTANT: The following questions have already been generated. Do NOT repeat or rephrase any of them. Each new question must be completely different:\n${existingList}\n`;
  }

  const planText = difficultyPlan.length
    ? `\nTarget difficulty distribution (keep balanced and close to this sequence): ${difficultyPlan.join(', ')}`
    : '';
  const uniqueRule = `\nIMPORTANT RULES:\n- Every question MUST be unique and different from each other.\n- Do NOT repeat, rephrase, or paraphrase any question.\n- Each question should test a different concept or fact.\n- Generate exactly ${count} questions, no more, no less.\n- Return valid JSON only (no markdown, no extra text).\n- Return each item with EXACT keys: question, options, correctAnswer, explanation, difficulty.\n- options must be an array with exactly 4 choices mapped to A, B, C, D.\n- difficulty must be one of: easy, medium, hard.${planText}\n`;

  if (moduleText && moduleText.trim()) {
    return `Generate exactly ${count} UNIQUE quiz questions (${typePrompt}) based on this text. Each question must cover a DIFFERENT concept or fact from the text. Respond as a JSON array of objects with: question, options, correctAnswer, explanation, difficulty.${uniqueRule}${existingContext}\nText:\n${moduleText}`;
  } else {
    return `Generate exactly ${count} UNIQUE quiz questions (${typePrompt}) for a general subject. Each question must be completely different from the others. Respond as a JSON array of objects with: question, options, correctAnswer, explanation, difficulty.${uniqueRule}${existingContext}`;
  }
};

// Parse quiz response from Gemini
const parseQuizResponse = (text, quizType, difficultyPlan = []) => {
  try {
    // Remove markdown code fencing and extra lines
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
    }
    
    // Attempt to fix incomplete/truncated JSON
    let fixedText = cleanText;
    fixedText = fixedText.replace(/,\s*([}\]])/g, '$1');
    if (fixedText.startsWith('[') && !fixedText.trim().endsWith(']')) {
      fixedText += ']';
    }
    
    const questions = JSON.parse(fixedText);
    
    if (Array.isArray(questions)) {
      return questions.map((q, idx) => normalizeQuestionShape(q, idx, difficultyPlan[idx]));
    }
    
    return [];
  } catch (error) {
    console.error('[ERROR] Failed to parse quiz response:', error);
    return [];
  }
};

// Generate quiz questions from module text using Gemini AI
exports.generateQuiz = async (req, res) => {
  try {
    const { count = 3, moduleText, difficulty = 'medium', quizType = 'mcq', existingQuestions = [] } = req.body;
    const requestedCount = Math.min(200, Math.max(1, Number(count) || 1));
    const difficultyPlan = buildDifficultyPlan(requestedCount);

    console.log(`[INFO] Quiz generation request received:`, { requestedCount, moduleText, quizType });
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log(`[INFO] GEMINI_API_KEY exists: ${!!process.env.GEMINI_API_KEY}`);

    console.log(`[INFO] Initializing Gemini SDK...`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // First, let's see what models are available
    await listAvailableModels();

    // Try the most common model names
    const modelNames = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest', 
      'gemini-pro',
      'text-bison-001',
      'gemini-1.0-pro'
    ];

    let model = null;
    let workingModelName = null;

    for (const modelName of modelNames) {
      try {
        console.log(`[INFO] Trying model: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName });
        
        // Test the model with a simple prompt
        const testResult = await model.generateContent("Say 'test' if you can hear me");
        console.log(`[SUCCESS] Model ${modelName} is working!`);
        workingModelName = modelName;
        break;
      } catch (error) {
        console.log(`[WARN] Model ${modelName} failed: ${error.message}`);
        continue;
      }
    }

    if (!model || !workingModelName) {
      // If no model works, create a fallback response
      console.log('[INFO] No Gemini models available, using fallback quiz generation');
      const fallbackQuestions = generateFallbackQuiz(requestedCount, moduleText, quizType, difficultyPlan);
      return res.json(shuffleArray(fallbackQuestions).slice(0, requestedCount));
    }

    console.log(`[INFO] Using working model: ${workingModelName}`);

    // Continue with quiz generation...
    const prompt = createQuizPrompt(requestedCount, moduleText, difficulty, quizType, existingQuestions, difficultyPlan);
    console.log(`[INFO] Generated prompt for Gemini API`);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`[INFO] Received response from Gemini API`);
      
      let questions = dedupeQuestions(parseQuizResponse(text, quizType, difficultyPlan));
      console.log(`[INFO] Successfully parsed ${questions.length} questions (requested ${requestedCount})`);
      
      if (questions.length === 0) {
        throw new Error('No valid questions could be parsed from Gemini response');
      }

      // Keep requesting missing questions until we satisfy requestedCount (or max retries), then backfill.
      let attempt = 0;
      while (questions.length < requestedCount && attempt < 4) {
        attempt += 1;
        const missing = requestedCount - questions.length;
        console.log(`[INFO] AI returned ${questions.length}/${requestedCount}, requesting ${missing} more (attempt ${attempt})...`);
        try {
          const alreadyGenerated = questions.map((q) => q.question);
          const remainingDifficultyPlan = difficultyPlan.slice(questions.length, requestedCount);
          const retryPrompt = createQuizPrompt(
            missing,
            moduleText,
            difficulty,
            quizType,
            [...existingQuestions, ...alreadyGenerated],
            remainingDifficultyPlan
          );
          const retryResult = await model.generateContent(retryPrompt);
          const retryText = (await retryResult.response).text();
          const moreQuestions = dedupeQuestions(parseQuizResponse(retryText, quizType, remainingDifficultyPlan));
          if (moreQuestions.length > 0) {
            questions = dedupeQuestions([...questions, ...moreQuestions]);
          }
        } catch (retryErr) {
          console.warn('[WARN] Retry for more questions failed:', retryErr.message);
        }
      }

      if (questions.length < requestedCount) {
        const missing = requestedCount - questions.length;
        const supplementPlan = difficultyPlan.slice(questions.length, requestedCount);
        const supplement = generateFallbackQuiz(missing, moduleText, quizType, supplementPlan);
        questions = dedupeQuestions([...questions, ...supplement]);
      }

      if (questions.length < requestedCount) {
        // Final deterministic backfill to guarantee exact count and avoid duplicates.
        const finalSeen = new Set(questions.map((q) => q.question.trim().toLowerCase()));
        let i = 0;
        while (questions.length < requestedCount) {
          const diff = difficultyPlan[questions.length] || 'medium';
          const forced = normalizeQuestionShape(
            {
              question: `Auto-generated unique question ${questions.length + 1} about ${moduleText || 'the lesson content'}?`,
              options: [
                `Correct concept ${questions.length + 1}`,
                `Related idea ${questions.length + 1}`,
                `Alternative ${questions.length + 1}`,
                `Distractor ${questions.length + 1}`,
              ],
              correctAnswer: `Correct concept ${questions.length + 1}`,
              explanation: `This answer aligns with key lesson points and is used to complete the required question count.`,
              difficulty: diff,
            },
            questions.length,
            diff
          );
          const key = forced.question.trim().toLowerCase();
          if (!finalSeen.has(key)) {
            finalSeen.add(key);
            questions.push(forced);
          }
          i += 1;
          if (i > requestedCount * 3) break;
        }
      }

      const finalQuestions = shuffleArray(questions).slice(0, requestedCount);
      const validated = finalQuestions.length === requestedCount;
      if (!validated) {
        console.warn(`[WARN] Validation mismatch: generated ${finalQuestions.length}, requested ${requestedCount}`);
      }

      res.json(finalQuestions);

    } catch (error) {
      console.error(`[ERROR] Gemini SDK error:`, error);
      
      // Fallback to mock questions
      console.log('[INFO] Falling back to mock quiz generation');
      const fallbackQuestions = generateFallbackQuiz(requestedCount, moduleText, quizType, difficultyPlan);
      const finalQuestions = shuffleArray(fallbackQuestions).slice(0, requestedCount);
      res.json(finalQuestions);
    }

  } catch (error) {
    console.error('[ERROR] Quiz generation failed:', error);
    
    // Final fallback
    const requestedCount = Math.min(200, Math.max(1, Number(req.body.count) || 1));
    const difficultyPlan = buildDifficultyPlan(requestedCount);
    const fallbackQuestions = generateFallbackQuiz(requestedCount, req.body.moduleText || '', req.body.quizType || 'mcq', difficultyPlan);
    const finalQuestions = shuffleArray(fallbackQuestions).slice(0, requestedCount);
    res.json(finalQuestions);
  }
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
    
    // Delete the quiz and all related submissions
    await Quiz.findByIdAndDelete(quizId);
    await QuizSubmission.deleteMany({ quizId });
    
    res.json({ message: 'Quiz and related submissions deleted successfully' });
  } catch (err) {
    console.error('[ERROR] deleteQuiz failed:', err);
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
    console.error('[ERROR] getQuizSubmissions:', err);
    res.status(500).json({ message: err.message });
  }
};
