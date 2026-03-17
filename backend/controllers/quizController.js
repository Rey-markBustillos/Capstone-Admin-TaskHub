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

const TOPIC_STOP_WORDS = new Set([
  'create', 'make', 'generate', 'quiz', 'quizzes', 'question', 'questions', 'about', 'the', 'a', 'an',
  'of', 'for', 'in', 'on', 'to', 'and', 'or', 'please', 'item', 'items', 'test', 'exam', 'module', 'lesson'
]);

const extractFocusTopic = (moduleText = '') => {
  const raw = String(moduleText || '').trim().toLowerCase();
  if (!raw) return 'general lesson';

  if (/(fraction|fractions)/.test(raw)) return 'fractions';
  if (/(algebra|equation|variable|polynomial)/.test(raw)) return 'algebra';
  if (/(geometry|triangle|angle|circle)/.test(raw)) return 'geometry';
  if (/(mathematics|math|arithmetic)/.test(raw)) return 'mathematics';
  if (/(biology|chemistry|physics|science)/.test(raw)) return 'science';

  const words = raw
    .split(/[^a-z0-9]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !TOPIC_STOP_WORDS.has(w));

  if (!words.length) return 'general lesson';

  const counts = new Map();
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] || 'general lesson';
};

const normalizeQuizType = (value) => {
  const t = String(value || '').trim().toLowerCase();
  if (t === 'true_false' || t === 'tf' || t === 'truefalse') return 'true_false';
  if (t === 'identification' || t === 'numeric' || t === 'fill_in_the_blank') return 'identification';
  return 'mcq';
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

const normalizeQuestionShape = (q, idx, forcedDifficulty, requestedQuizType = 'mcq') => {
  const resolvedType = normalizeQuizType(q?.type || requestedQuizType);
  const question = sanitizeQuestionText(q?.question, idx);
  const explanation = String(q?.explanation || `This is the best answer based on the module content for this topic.`).trim();
  const difficulty = normalizeDifficulty(forcedDifficulty || q?.difficulty);

  if (resolvedType === 'true_false') {
    const tfRaw = String(q?.correctAnswer || q?.answer || '').trim().toLowerCase();
    const correctAnswer = tfRaw === 'false' ? 'False' : 'True';
    return {
      type: 'true_false',
      displayType: 'True/False',
      question,
      options: ['True', 'False'],
      correctAnswer,
      answer: correctAnswer,
      explanation,
      difficulty,
      labeledOptions: {
        A: 'True',
        B: 'False',
        C: '',
        D: '',
      },
    };
  }

  if (resolvedType === 'identification') {
    const identificationAnswer = String(q?.correctAnswer || q?.answer || '').trim() || `Answer ${idx + 1}`;
    return {
      type: 'identification',
      displayType: 'Identification',
      question,
      options: [],
      correctAnswer: identificationAnswer,
      answer: identificationAnswer,
      explanation,
      difficulty,
      labeledOptions: {
        A: '',
        B: '',
        C: '',
        D: '',
      },
    };
  }

  const options = ensureFourOptions(q?.options, q?.correctAnswer || q?.answer);
  const rawCorrect = String(q?.correctAnswer || q?.answer || '').trim();
  const fallbackCorrect = options[0];
  const correctAnswer = options.find((opt) => opt.toLowerCase() === rawCorrect.toLowerCase()) || fallbackCorrect;

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

const generateFractionMcq = (i) => {
  const index = i + 1;
  const type = i % 6;
  if (type === 0) {
    const num = 2 + (i % 7);
    const den = num + 2;
    const proper = num < den ? 'proper fraction' : 'improper fraction';
    return {
      question: `What kind of fraction is ${num}/${den}?`,
      options: ['Proper fraction', 'Improper fraction', 'Mixed number', 'Whole number'],
      correctAnswer: proper.replace(/^./, (c) => c.toUpperCase()),
    };
  }
  if (type === 1) {
    const den = 4 + (i % 5);
    const left = 1 + (i % (den - 1));
    const right = den - left;
    return {
      question: `What is ${left}/${den} + ${right}/${den}?`,
      options: ['1', `${den}/${den}`, `${left + right}/${den + 1}`, `${left + right}/${den * 2}`],
      correctAnswer: '1',
    };
  }
  if (type === 2) {
    const whole = 1 + (i % 4);
    const num = 1 + (i % 3);
    const den = num + 2;
    return {
      question: `Convert the mixed number ${whole} ${num}/${den} to an improper fraction.`,
      options: [
        `${whole * den + num}/${den}`,
        `${whole + num}/${den}`,
        `${whole * den - num}/${den}`,
        `${num}/${whole * den}`,
      ],
      correctAnswer: `${whole * den + num}/${den}`,
    };
  }
  if (type === 3) {
    const a = 1 + (i % 4);
    const b = a + 1;
    return {
      question: `Which is greater: ${a}/${b} or ${b}/${b + 1}?`,
      options: [`${a}/${b}`, `${b}/${b + 1}`, 'They are equal', 'Cannot be determined'],
      correctAnswer: `${b}/${b + 1}`,
    };
  }
  if (type === 4) {
    const num = 2 + (i % 6);
    const den = 4 + (i % 6);
    return {
      question: `What is the equivalent fraction of ${num}/${den} when both numerator and denominator are multiplied by 2?`,
      options: [`${num * 2}/${den * 2}`, `${num + 2}/${den + 2}`, `${num * 2}/${den}`, `${num}/${den * 2}`],
      correctAnswer: `${num * 2}/${den * 2}`,
    };
  }
  const num = 1 + (i % 5);
  const den = num + 3;
  return {
    question: `What is the decimal value of ${num}/${den} (nearest hundredth)?`,
    options: [
      (num / den).toFixed(2),
      (num / (den + 1)).toFixed(2),
      ((num + 1) / den).toFixed(2),
      (num / (den - 1)).toFixed(2),
    ],
    correctAnswer: (num / den).toFixed(2),
  };
};

const generateFractionTrueFalse = (i) => {
  const type = i % 5;
  if (type === 0) {
    return { question: 'A fraction with the same numerator and denominator is always equal to 1.', correctAnswer: 'True' };
  }
  if (type === 1) {
    return { question: 'In a proper fraction, the numerator is greater than the denominator.', correctAnswer: 'False' };
  }
  if (type === 2) {
    return { question: 'Equivalent fractions represent the same value.', correctAnswer: 'True' };
  }
  if (type === 3) {
    return { question: 'To add fractions, you always add denominators directly.', correctAnswer: 'False' };
  }
  return { question: 'A mixed number can be converted into an improper fraction.', correctAnswer: 'True' };
};

const generateFractionIdentification = (i) => {
  const type = i % 5;
  if (type === 0) {
    const num = 1 + (i % 4);
    const den = num + 2;
    return { question: `Write ${num}/${den} as a percentage.`, correctAnswer: `${Math.round((num / den) * 100)}%` };
  }
  if (type === 1) {
    const whole = 1 + (i % 3);
    const num = 1 + (i % 2);
    const den = 4;
    return { question: `Convert ${whole} ${num}/${den} to an improper fraction.`, correctAnswer: `${whole * den + num}/${den}` };
  }
  if (type === 2) {
    return { question: 'What do you call a fraction where the numerator is less than the denominator?', correctAnswer: 'Proper fraction' };
  }
  if (type === 3) {
    return { question: 'Name the fraction equivalent to 1/2 with denominator 10.', correctAnswer: '5/10' };
  }
  return { question: 'What is the numerator in the fraction 7/9?', correctAnswer: '7' };
};

// Add fallback quiz generation with topic-specific questions
const generateFallbackQuiz = (count, moduleText, quizType, difficultyPlan = []) => {
  const normalizedType = normalizeQuizType(quizType);
  const topic = extractFocusTopic(moduleText);
  const questions = [];
  const difficultyForIndex = (i) => difficultyPlan[i] || DIFFICULTIES[i % DIFFICULTIES.length];

  for (let i = 0; i < count; i++) {
    let generated;

    if (topic === 'fractions') {
      if (normalizedType === 'true_false') generated = generateFractionTrueFalse(i);
      else if (normalizedType === 'identification') generated = generateFractionIdentification(i);
      else generated = generateFractionMcq(i);
    } else if (topic === 'mathematics' || topic === 'algebra' || topic === 'geometry') {
      const seed = i + 2;
      if (normalizedType === 'true_false') {
        generated = {
          question: `${seed} + ${seed} is equal to ${seed * 2}.`,
          correctAnswer: 'True',
        };
      } else if (normalizedType === 'identification') {
        generated = {
          question: `Solve: ${seed} x ${seed + 1}`,
          correctAnswer: String(seed * (seed + 1)),
        };
      } else {
        generated = {
          question: `What is ${seed} x ${seed + 1}?`,
          options: [
            String(seed * (seed + 1)),
            String(seed + (seed + 1)),
            String(seed * seed),
            String((seed + 1) * (seed + 1)),
          ],
          correctAnswer: String(seed * (seed + 1)),
        };
      }
    } else {
      const label = topic === 'general lesson' ? 'the lesson topic' : topic;
      if (normalizedType === 'true_false') {
        generated = {
          question: `The statement is related to ${label}.`,
          correctAnswer: 'True',
        };
      } else if (normalizedType === 'identification') {
        generated = {
          question: `Write one key term related to ${label}.`,
          correctAnswer: label,
        };
      } else {
        generated = {
          question: `Which option is directly related to ${label}?`,
          options: [label, 'Sports', 'Entertainment', 'Cooking'],
          correctAnswer: label,
        };
      }
    }

    questions.push(
      normalizeQuestionShape(
        {
          ...generated,
          explanation: `This answer is aligned with the quiz focus on ${topic}.`,
          difficulty: difficultyForIndex(i),
          type: normalizedType,
        },
        i,
        difficultyForIndex(i),
        normalizedType
      )
    );
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
  const focusTopic = extractFocusTopic(moduleText);
  const uniqueRule = `\nIMPORTANT RULES:\n- Every question MUST be unique and different from each other.\n- Do NOT repeat, rephrase, or paraphrase any question.\n- Each question should test a different concept or fact.\n- Generate exactly ${count} questions, no more, no less.\n- Return valid JSON only (no markdown, no extra text).\n- Return each item with EXACT keys: question, options, correctAnswer, explanation, difficulty.\n- options must be an array with exactly 4 choices mapped to A, B, C, D.\n- difficulty must be one of: easy, medium, hard.${planText}\n`;
  const topicalRule = `\nTOPIC FOCUS RULES:\n- Focus strictly on this lesson topic: ${focusTopic}.\n- Do NOT create meta-questions about prompts such as \"create a quiz\" or words like \"about\", \"item\", \"quiz\" in the question text.\n- If topic is fractions/math, questions must be about mathematical operations, concepts, or problem-solving for that topic.`;

  if (moduleText && moduleText.trim()) {
    return `Generate exactly ${count} UNIQUE quiz questions (${typePrompt}) based on this text. Each question must cover a DIFFERENT concept or fact from the text. Respond as a JSON array of objects with: question, options, correctAnswer, explanation, difficulty.${uniqueRule}${topicalRule}${existingContext}\nText:\n${moduleText}`;
  } else {
    return `Generate exactly ${count} UNIQUE quiz questions (${typePrompt}) for the topic: ${focusTopic}. Each question must be completely different from the others. Respond as a JSON array of objects with: question, options, correctAnswer, explanation, difficulty.${uniqueRule}${topicalRule}${existingContext}`;
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
      return questions.map((q, idx) => {
        const targetType = quizType === 'mixed' ? q?.type : quizType;
        return normalizeQuestionShape(q, idx, difficultyPlan[idx], targetType);
      });
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
              type: quizType,
            },
            questions.length,
            diff,
            quizType
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
      'identification': 'numeric',
      'fill_in_the_blank': 'numeric',
      'numeric': 'numeric',
      'mcq': 'mcq',
      'tf': 'tf'
    };
    const mappedQuestions = (questions || []).map(q => ({
      type: typeMap[q.type] || 'mcq',
      question: q.question,
      options: q.options || [],
      answer: q.answer ?? q.correctAnswer
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
