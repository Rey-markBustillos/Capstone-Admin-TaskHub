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

const buildDifficultyPlan = (count, selectedDifficulty = 'medium') => {
  const normalized = normalizeDifficulty(selectedDifficulty);
  return Array.from({ length: count }, () => normalized);
};

const normalizeDifficulty = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (DIFFICULTIES.includes(v)) return v;
  return 'medium';
};

const cleanText = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const QUESTION_META_PATTERN = /(create|generate)\s+(a\s+)?quiz|module text|text above|prompt|lesson topic|based on this text|based on the provided/i;
const GENERIC_QUESTION_PATTERN = /which (?:term|concept|option) is most directly connected to|identify one key term connected to|is the central focus of this lesson|topic being assessed in this quiz|key term related to|statement is related to/i;
const BAD_DISTRACTOR_PATTERN = /^(option [a-z0-9]+|unrelated topic|unrelated subject|different subject area|different lesson area|all of the above|none of the above)$/i;
const COMMON_QUESTION_OPENERS = new Set([
  'what is',
  'which is',
  'which term',
  'what term',
  'name the',
  'identify the',
  'select the',
]);

const TOPIC_STOP_WORDS = new Set([
  'create', 'make', 'generate', 'quiz', 'quizzes', 'question', 'questions', 'about', 'the', 'a', 'an',
  'of', 'for', 'in', 'on', 'to', 'and', 'or', 'please', 'item', 'items', 'test', 'exam', 'module', 'lesson'
]);

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const upperFirst = (value = '') => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

const lowerFirst = (value = '') => {
  if (!value) return '';
  if (value.length > 1 && value[0] === value[0].toUpperCase() && value[1] === value[1].toUpperCase()) {
    return value;
  }
  return value.charAt(0).toLowerCase() + value.slice(1);
};

const normalizeConceptLabel = (value = '') =>
  cleanText(value)
    .replace(/^[\d.)\-\s]+/, '')
    .replace(/[:;,.!?]+$/, '');

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

const buildKeywordPool = (...values) => {
  const seen = new Set();
  const keywords = [];

  values.forEach((value) => {
    cleanText(value)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 3 && !TOPIC_STOP_WORDS.has(word))
      .forEach((word) => {
        if (!seen.has(word)) {
          seen.add(word);
          keywords.push(word);
        }
      });
  });

  return keywords.slice(0, 20);
};

const extractLessonSentences = (value = '') => {
  const seen = new Set();
  return String(value || '')
    .replace(/\r/g, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => cleanText(sentence))
    .filter((sentence) => sentence.length >= 25)
    .filter((sentence) => sentence.split(/\s+/).length >= 5)
    .filter((sentence) => !QUESTION_META_PATTERN.test(sentence))
    .filter((sentence) => !GENERIC_QUESTION_PATTERN.test(sentence))
    .filter((sentence) => {
      const key = sentence.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 30);
};

const extractDefinitionPairs = (value = '') => {
  const sources = extractLessonSentences(value);
  const pairs = [];
  const seen = new Set();
  const patterns = [
    /^\s*([A-Za-z][A-Za-z0-9/+()\- ]{1,60}?)\s+stands for\s+(.{8,})$/i,
    /^\s*([A-Za-z][A-Za-z0-9/+()\- ]{1,60}?)\s+(?:is|are)\s+(.{8,})$/i,
    /^\s*([A-Za-z][A-Za-z0-9/+()\- ]{1,60}?)\s+(?:refers to|means|describes|defines|explains|represents)\s+(.{8,})$/i,
    /^\s*([A-Za-z][A-Za-z0-9/+()\- ]{1,60}?)\s*[:\-–]\s+(.{8,})$/i,
  ];

  sources.forEach((sentence) => {
    patterns.some((pattern) => {
      const match = sentence.match(pattern);
      if (!match) return false;

      const term = normalizeConceptLabel(match[1]);
      const description = cleanText(match[2]).replace(/[.?!]+$/, '');
      const termWordCount = term.split(/\s+/).filter(Boolean).length;

      if (
        !term ||
        !description ||
        termWordCount > 6 ||
        QUESTION_META_PATTERN.test(description) ||
        GENERIC_QUESTION_PATTERN.test(description) ||
        TOPIC_STOP_WORDS.has(term.toLowerCase())
      ) {
        return false;
      }

      const key = `${term.toLowerCase()}|${description.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({
          term,
          description,
          sentence: cleanText(sentence),
        });
      }

      return true;
    });
  });

  return pairs.slice(0, 18);
};

const extractConceptTerms = (value = '', definitionPairs = [], keywords = []) => {
  const seen = new Set();
  const terms = [];
  const addTerm = (term) => {
    const normalized = normalizeConceptLabel(term);
    const key = normalized.toLowerCase();
    if (
      !normalized ||
      seen.has(key) ||
      normalized.split(/\s+/).length > 6 ||
      TOPIC_STOP_WORDS.has(key)
    ) {
      return;
    }
    seen.add(key);
    terms.push(normalized);
  };

  definitionPairs.forEach((pair) => addTerm(pair.term));

  const raw = String(value || '');
  const acronymMatches = raw.match(/\b[A-Z]{2,10}\b/g) || [];
  acronymMatches.forEach((term) => addTerm(term));

  keywords.forEach((keyword) => addTerm(keyword));

  return terms.slice(0, 16);
};

const buildLessonFacts = (context) => {
  if (context?.definitionPairs?.length) {
    return context.definitionPairs;
  }

  const sentences = context?.lessonSentences || [];
  const conceptTerms = context?.conceptTerms || [];
  const facts = [];
  const seen = new Set();

  sentences.forEach((sentence, index) => {
    const matchingTerm =
      conceptTerms.find((term) => sentence.toLowerCase().includes(term.toLowerCase())) ||
      conceptTerms[index % Math.max(conceptTerms.length, 1)] ||
      context?.topic;

    if (!matchingTerm) return;
    const termPattern = new RegExp(`^${escapeRegExp(cleanText(matchingTerm))}\\s+(?:is|are|refers to|means|stands for|describes|explains)\\s+`, 'i');
    const description = cleanText(sentence)
      .replace(termPattern, '')
      .replace(/[.?!]+$/, '');

    const fact = {
      term: normalizeConceptLabel(matchingTerm),
      description,
      sentence: cleanText(sentence),
    };
    if (!fact.description) return;
    const key = `${fact.term.toLowerCase()}|${fact.description.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      facts.push(fact);
    }
  });

  return facts.slice(0, 18);
};

const buildQuizContext = ({ topic = '', focusDescription = '', moduleText = '' } = {}) => {
  const cleanedTopic = cleanText(topic);
  const cleanedFocusDescription = cleanText(focusDescription);
  const cleanedModuleText = cleanText(moduleText);
  const resolvedTopic = cleanedTopic || extractFocusTopic(`${cleanedFocusDescription} ${cleanedModuleText}`) || 'general lesson';
  const combinedLessonText = [cleanedFocusDescription, cleanedModuleText].filter(Boolean).join('\n');
  const lessonSentences = extractLessonSentences(combinedLessonText);
  const definitionPairs = extractDefinitionPairs(combinedLessonText);
  const keywords = buildKeywordPool(resolvedTopic, cleanedFocusDescription, cleanedModuleText);
  const conceptTerms = extractConceptTerms([cleanedTopic, cleanedFocusDescription, cleanedModuleText].join('\n'), definitionPairs, keywords);

  return {
    topic: resolvedTopic,
    focusDescription: cleanedFocusDescription,
    moduleText: cleanedModuleText,
    keywords,
    lessonSentences,
    definitionPairs,
    conceptTerms,
  };
};

const normalizeQuizType = (value) => {
  const t = String(value || '').trim().toLowerCase();
  if (t === 'mixed') return 'mixed';
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

const sanitizeQuestionText = (value, idx, questionType = 'mcq') => {
  const q = cleanText(value);
  const normalizedType = normalizeQuizType(questionType);

  if (!q) {
    return normalizedType === 'true_false'
      ? `Generated statement ${idx + 1}.`
      : `Generated question ${idx + 1}?`;
  }

  if (normalizedType === 'true_false') {
    return /[.?!]$/.test(q) ? q : `${q}.`;
  }

  if (q.endsWith('?')) return q;
  return /[.!]$/.test(q) ? `${q.slice(0, -1)}?` : `${q}?`;
};

const normalizeQuestionShape = (q, idx, forcedDifficulty, requestedQuizType = 'mcq') => {
  const resolvedType = normalizeQuizType(q?.type || requestedQuizType);
  const question = sanitizeQuestionText(q?.question, idx, resolvedType);
  const explanation = cleanText(q?.explanation || 'This answer aligns with the quiz focus and the expected learning outcome.');
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

const extractQuestionOpener = (prompt = '') => {
  const words = cleanText(prompt).toLowerCase().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).join(' ');
};

const buildQuestionPatternSignature = (prompt = '', context = {}) => {
  let signature = cleanText(prompt).toLowerCase();
  signature = signature.replace(/\b\d+(?:[./]\d+)?\b/g, '<n>');
  signature = signature.replace(/\b[a-z]\.\s*/g, '');
  signature = signature.replace(/\b(true|false)\b/g, '<bool>');
  [...(context?.keywords || []), ...(context?.conceptTerms || [])]
    .slice(0, 12)
    .forEach((term) => {
      const normalized = cleanText(term).toLowerCase();
      if (!normalized) return;
      signature = signature.replace(new RegExp(`\\b${escapeRegExp(normalized)}\\b`, 'g'), '<concept>');
    });

  return signature.split(/\s+/).slice(0, 14).join(' ');
};

const isQuestionStructureValid = (question, requestedQuizType = 'mcq') => {
  const resolvedType = normalizeQuizType(question?.type || requestedQuizType);
  const prompt = cleanText(question?.question);
  const answer = cleanText(question?.answer || question?.correctAnswer);

  if (!prompt || QUESTION_META_PATTERN.test(prompt) || GENERIC_QUESTION_PATTERN.test(prompt)) return false;

  if (resolvedType === 'true_false') {
    return answer === 'True' || answer === 'False';
  }

  if (resolvedType === 'identification') {
    return Boolean(answer) && !GENERIC_QUESTION_PATTERN.test(answer);
  }

  if (!Array.isArray(question?.options) || question.options.length !== 4 || !answer) {
    return false;
  }

  const uniqueOptions = new Set(
    question.options.map((option) => cleanText(option).toLowerCase()).filter(Boolean)
  );

  if (uniqueOptions.size !== 4) return false;
  if (question.options.some((option) => BAD_DISTRACTOR_PATTERN.test(cleanText(option)))) return false;

  return question.options.some((option) => cleanText(option).toLowerCase() === answer.toLowerCase());
};

const isQuestionRelevantToContext = (question, context) => {
  const content = [
    question?.question,
    question?.answer,
    question?.correctAnswer,
    question?.explanation,
    ...(Array.isArray(question?.options) ? question.options : []),
  ]
    .map((value) => cleanText(value).toLowerCase())
    .join(' ');

  if (!content || QUESTION_META_PATTERN.test(content)) return false;
  const alignmentTerms = [...(context?.keywords || []), ...(context?.conceptTerms || [])]
    .map((term) => cleanText(term).toLowerCase())
    .filter(Boolean);
  if (!alignmentTerms.length) return true;

  const keywordMatches = alignmentTerms.filter((keyword) => content.includes(keyword)).length;
  const genericFallbackPattern = /directly related to|key term connected to|different lesson area|unrelated topic|different subject area/i;
  if (genericFallbackPattern.test(content) && keywordMatches === 0) return false;

  return keywordMatches >= 1 || content.includes(cleanText(context?.topic).toLowerCase());
};

const filterQuestionsForContext = (questions, context, requestedQuizType, expectedCount = questions.length) => {
  const signatureSeen = new Set();
  const openerCounts = new Map();
  const accepted = [];
  const commonOpenerLimit = Math.max(1, Math.ceil(expectedCount / 4));

  dedupeQuestions(questions).forEach((question) => {
    if (!isQuestionStructureValid(question, requestedQuizType) || !isQuestionRelevantToContext(question, context)) {
      return;
    }

    const signature = buildQuestionPatternSignature(question.question, context);
    if (signatureSeen.has(signature)) return;

    const opener = extractQuestionOpener(question.question);
    const openerCount = openerCounts.get(opener) || 0;
    if (COMMON_QUESTION_OPENERS.has(opener) && openerCount >= commonOpenerLimit) {
      return;
    }

    signatureSeen.add(signature);
    openerCounts.set(opener, openerCount + 1);
    accepted.push(question);
  });

  return accepted;
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

const buildRelatedTermPool = (context = {}, correctTerm = '') => {
  const seen = new Set();
  const pool = [];
  const candidates = [
    ...(context.definitionPairs || []).map((pair) => pair.term),
    ...(context.conceptTerms || []),
    ...(context.keywords || []),
  ];

  candidates.forEach((candidate) => {
    const normalized = normalizeConceptLabel(candidate);
    const key = normalized.toLowerCase();
    if (!normalized || key === cleanText(correctTerm).toLowerCase() || seen.has(key)) return;
    seen.add(key);
    pool.push(normalized);
  });

  return pool;
};

const buildPlausibleDistractors = (context, correctTerm, count = 3) => {
  const pool = buildRelatedTermPool(context, correctTerm);
  const distractors = [];

  shuffleArray(pool).forEach((candidate) => {
    if (distractors.length < count && !BAD_DISTRACTOR_PATTERN.test(candidate)) {
      distractors.push(candidate);
    }
  });

  const topic = context?.topic || 'lesson';
  const supplemental = [
    `${upperFirst(topic)} concept`,
    `${upperFirst(topic)} principle`,
    `${upperFirst(topic)} method`,
    `${upperFirst(topic)} element`,
  ];

  supplemental.forEach((candidate) => {
    const normalized = normalizeConceptLabel(candidate);
    const key = normalized.toLowerCase();
    if (
      distractors.length < count &&
      key !== cleanText(correctTerm).toLowerCase() &&
      !distractors.some((item) => item.toLowerCase() === key)
    ) {
      distractors.push(normalized);
    }
  });

  return distractors.slice(0, count);
};

const buildLessonBasedQuestion = (fact, alternateFact, context, questionType, difficulty, index) => {
  const cleanDescription = cleanText(fact.description).replace(/[.?!]+$/, '');
  const scenarioDescription = lowerFirst(cleanDescription);
  const correctTerm = fact.term;

  if (questionType === 'true_false') {
    if (alternateFact && index % 2 === 1) {
      return {
        question: `The lesson states that ${correctTerm} is ${lowerFirst(alternateFact.description).replace(/[.?!]+$/, '')}.`,
        correctAnswer: 'False',
      };
    }

    const hardTemplate = [
      `${correctTerm} is ${lowerFirst(cleanDescription)}.`,
      `A learner applying ${correctTerm} would be working with ${lowerFirst(cleanDescription)}.`,
      `The lesson explains ${correctTerm} as ${lowerFirst(cleanDescription)}.`,
    ];

    return {
      question: hardTemplate[index % hardTemplate.length],
      correctAnswer: 'True',
    };
  }

  if (questionType === 'identification') {
    const identificationTemplates = difficulty === 'hard'
      ? [
          `A learner needs to ${scenarioDescription}. Write the concept that should be applied.`,
          `During a class activity, students are asked to ${scenarioDescription}. Name the correct concept.`,
          `The lesson describes a process that ${scenarioDescription}. Identify the term being referred to.`,
        ]
      : difficulty === 'medium'
        ? [
            `Name the concept that ${scenarioDescription}.`,
            `Identify the term described as ${scenarioDescription}.`,
            `Write the lesson concept used to ${scenarioDescription}.`,
          ]
        : [
            `Give the term that means ${scenarioDescription}.`,
            `Name the concept described as ${scenarioDescription}.`,
            `Identify the lesson term for ${scenarioDescription}.`,
          ];

    return {
      question: identificationTemplates[index % identificationTemplates.length],
      correctAnswer: correctTerm,
    };
  }

  const distractors = buildPlausibleDistractors(context, correctTerm, 3);
  const mcqTemplates = difficulty === 'hard'
    ? [
        `A learner is asked to ${scenarioDescription}. Which concept should be applied?`,
        `During a performance task, students must ${scenarioDescription}. Select the most appropriate concept.`,
        `A teacher presents a scenario focused on how to ${scenarioDescription}. Which concept best fits the situation?`,
      ]
    : difficulty === 'medium'
      ? [
          `The lesson explains a concept used to ${scenarioDescription}. What is that concept?`,
          `A student wants to ${scenarioDescription}. Which concept from the lesson should the student use?`,
          `Choose the concept that best matches this function: ${scenarioDescription}.`,
        ]
      : [
          `Choose the term best described as ${scenarioDescription}.`,
          `The lesson defines a concept as ${scenarioDescription}. Which term matches that definition?`,
          `From the lesson definitions, ${scenarioDescription}. What concept is being described?`,
        ];

  return {
    question: mcqTemplates[index % mcqTemplates.length],
    options: shuffleArray([correctTerm, ...distractors]).slice(0, 4),
    correctAnswer: correctTerm,
  };
};

// Add fallback quiz generation with topic-specific questions
const generateFallbackQuiz = (count, context, quizType, difficultyPlan = []) => {
  const normalizedType = normalizeQuizType(quizType);
  const topic = context?.topic || extractFocusTopic(context?.moduleText || '');
  const focusLabel = context?.focusDescription || topic;
  const lessonFacts = buildLessonFacts(context);
  const questions = [];
  const difficultyForIndex = (i) => difficultyPlan[i] || 'medium';

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
      const lessonFact = lessonFacts[i % Math.max(lessonFacts.length, 1)] || {
        term: context?.conceptTerms?.[0] || upperFirst(topic || 'Lesson concept'),
        description: cleanText(focusLabel || topic || 'the core concept discussed in the lesson'),
        sentence: cleanText(focusLabel || topic || 'The lesson introduces a core concept.'),
      };
      const alternateFact = lessonFacts.length > 1
        ? lessonFacts[(i + 1) % lessonFacts.length]
        : null;
      generated = buildLessonBasedQuestion(
        lessonFact,
        alternateFact,
        context,
        normalizedType,
        difficultyForIndex(i),
        i
      );
    }

    questions.push(
      normalizeQuestionShape(
        {
          ...generated,
          explanation: `This answer is aligned with the quiz focus on ${focusLabel}.`,
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
const createQuizPrompt = (
  count,
  context,
  difficulty,
  quizType,
  existingQuestions = [],
  difficultyPlan = [],
  includeExplanations = true
) => {
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const typePrompt = quizType === 'mcq'
    ? 'multiple choice'
    : quizType === 'true_false'
      ? 'true or false'
      : quizType === 'identification'
        ? 'identification'
        : 'mixed types';

  const existingContext = existingQuestions.length > 0
    ? `\nALREADY GENERATED QUESTIONS (avoid duplicates or close paraphrases):\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
    : '';

  const typeRules = quizType === 'mcq'
    ? `\nMULTIPLE CHOICE RULES:\n- Provide exactly 4 answer choices in the options array.\n- Each choice must be distinct, plausible, and student-friendly.\n- Only one choice may be correct.\n- Do not use "All of the above" or "None of the above".`
    : quizType === 'true_false'
      ? `\nTRUE/FALSE RULES:\n- Write clear, factual statements only.\n- Set options to ["True","False"].\n- correctAnswer must be exactly "True" or "False".`
      : quizType === 'identification'
        ? `\nIDENTIFICATION RULES:\n- Write direct, answerable short-answer prompts.\n- Use an empty array for options.\n- correctAnswer should be a short, specific answer.`
        : `\nMIXED TYPE RULES:\n- You may mix multiple choice, true_false, and identification items.\n- Every item must include its type.\n- Respect the output rules for the chosen item type.`;

  const explanationRule = includeExplanations
    ? '\n- explanation must be a short student-friendly reason why the answer is correct.'
    : '\n- explanation must be an empty string.';

  const difficultySequence = difficultyPlan.length ? difficultyPlan.join(', ') : normalizedDifficulty;
  const lessonFactsPreview = buildLessonFacts(context)
    .slice(0, 8)
    .map((fact, index) => `${index + 1}. ${fact.term}: ${fact.description}`)
    .join('\n');

  return `Generate exactly ${count} UNIQUE ${typePrompt} quiz questions.

QUIZ CONTEXT:
- Topic / Subject: ${context.topic}
- Description / Focus: ${context.focusDescription || 'Use the main topic only.'}
- Required difficulty for ALL questions: ${normalizedDifficulty}
- Difficulty sequence to honor: ${difficultySequence}
- Keywords to stay aligned with: ${(context.keywords || []).join(', ') || context.topic}

SOURCE MATERIAL:
${context.moduleText || 'No source text provided. Use only broadly accepted facts about the topic and stay within the stated focus.'}

LESSON FACTS TO USE:
${lessonFactsPreview || '- No extracted lesson facts were found. Infer carefully from the topic and focus only.'}

OUTPUT RULES:
- Return valid JSON only. No markdown. No commentary.
- Return a JSON array with exactly ${count} items.
- Every item must use EXACT keys: question, options, correctAnswer, explanation, difficulty, type.
- First, silently understand the lesson and identify the most important ideas before writing anything.
- question must be clear, grammatical, and student-friendly.
- Keep every question directly relevant to the topic and focus.
- Avoid vague, generic, or meta questions about the prompt, quiz creation, or source text itself.
- NEVER write weak questions like "Which is related to [topic]?" or "The statement is about [topic]."
- Do not repeat or paraphrase another question.
- Do not overuse the same question opener or structure. Mix definition, interpretation, comparison, scenario, and application styles.
- Use real lesson knowledge. Questions should test understanding, not just mention the topic.
- Multiple-choice distractors must be plausible, lesson-related, and academically realistic.
- Easy questions should focus on basic definitions or recognition.
- Medium questions should test understanding, function, and usage.
- Hard questions should use application, analysis, or short scenario-based reasoning.
- difficulty must always be "${normalizedDifficulty}".${explanationRule}${typeRules}${existingContext}`;
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
    
    const parsed = JSON.parse(fixedText);
    const questions = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];

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
    const {
      count = 3,
      topic = '',
      focusDescription = '',
      moduleText = '',
      difficulty = 'medium',
      quizType = 'mcq',
      existingQuestions = [],
      includeExplanations = true,
      shuffleQuestions = false,
    } = req.body;
    const requestedCount = Math.min(200, Math.max(1, Number(count) || 1));
    const normalizedQuizType = normalizeQuizType(quizType);
    const normalizedDifficulty = normalizeDifficulty(difficulty);
    const difficultyPlan = buildDifficultyPlan(requestedCount, normalizedDifficulty);
    const context = buildQuizContext({ topic, focusDescription, moduleText });
    const applyFinalOrdering = (items) => (shuffleQuestions ? shuffleArray(items) : items);

    console.log('[INFO] Quiz generation request received:', {
      requestedCount,
      topic: context.topic,
      quizType: normalizedQuizType,
      difficulty: normalizedDifficulty,
      hasModuleText: Boolean(context.moduleText),
    });
    
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
      const fallbackQuestions = generateFallbackQuiz(requestedCount, context, normalizedQuizType, difficultyPlan);
      return res.json(applyFinalOrdering(fallbackQuestions).slice(0, requestedCount));
    }

    console.log(`[INFO] Using working model: ${workingModelName}`);

    // Continue with quiz generation...
    const prompt = createQuizPrompt(
      requestedCount,
      context,
      normalizedDifficulty,
      normalizedQuizType,
      existingQuestions,
      difficultyPlan,
      includeExplanations
    );
    console.log(`[INFO] Generated prompt for Gemini API`);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`[INFO] Received response from Gemini API`);
      
      let questions = filterQuestionsForContext(
        parseQuizResponse(text, normalizedQuizType, difficultyPlan),
        context,
        normalizedQuizType,
        requestedCount
      );
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
            context,
            normalizedDifficulty,
            normalizedQuizType,
            [...existingQuestions, ...alreadyGenerated],
            remainingDifficultyPlan,
            includeExplanations
          );
          const retryResult = await model.generateContent(retryPrompt);
          const retryText = (await retryResult.response).text();
          const moreQuestions = filterQuestionsForContext(
            parseQuizResponse(retryText, normalizedQuizType, remainingDifficultyPlan),
            context,
            normalizedQuizType,
            requestedCount
          );
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
        const supplement = generateFallbackQuiz(missing, context, normalizedQuizType, supplementPlan);
        questions = filterQuestionsForContext([...questions, ...supplement], context, normalizedQuizType, requestedCount);
      }

      if (questions.length < requestedCount) {
        // Final deterministic lesson-based backfill to guarantee exact count.
        const finalSeen = new Set(questions.map((q) => q.question.trim().toLowerCase()));
        const lessonFacts = buildLessonFacts(context);
        let i = 0;
        while (questions.length < requestedCount) {
          const diff = difficultyPlan[questions.length] || normalizedDifficulty;
          const fact = lessonFacts[i % Math.max(lessonFacts.length, 1)] || {
            term: context.conceptTerms?.[0] || upperFirst(context.topic || 'Lesson concept'),
            description: cleanText(context.focusDescription || context.topic || 'the key lesson concept'),
            sentence: cleanText(context.focusDescription || context.topic || 'The lesson introduces a key concept.'),
          };
          const alternateFact = lessonFacts.length > 1
            ? lessonFacts[(i + 1) % lessonFacts.length]
            : null;
          const forced = normalizeQuestionShape(
            {
              ...buildLessonBasedQuestion(
                fact,
                alternateFact,
                context,
                normalizedQuizType,
                diff,
                questions.length + i
              ),
              explanation: includeExplanations
                ? `This answer is based on the lesson content and is used to complete the required question count without repeating earlier questions.`
                : '',
              difficulty: diff,
              type: normalizedQuizType,
            },
            questions.length,
            diff,
            normalizedQuizType
          );
          const key = forced.question.trim().toLowerCase();
          if (!finalSeen.has(key) && isQuestionStructureValid(forced, normalizedQuizType)) {
            finalSeen.add(key);
            questions.push(forced);
          }
          i += 1;
          if (i > requestedCount * 3) break;
        }
      }

      questions = filterQuestionsForContext(questions, context, normalizedQuizType, requestedCount);

      if (questions.length < requestedCount) {
        const lessonFacts = buildLessonFacts(context);
        const finalSeen = new Set(questions.map((q) => q.question.trim().toLowerCase()));
        let safety = 0;

        while (questions.length < requestedCount && safety < requestedCount * 6) {
          const diff = difficultyPlan[questions.length] || normalizedDifficulty;
          const fact = lessonFacts[safety % Math.max(lessonFacts.length, 1)] || {
            term: context.conceptTerms?.[0] || upperFirst(context.topic || 'Lesson concept'),
            description: cleanText(context.focusDescription || context.topic || 'the key lesson concept'),
            sentence: cleanText(context.focusDescription || context.topic || 'The lesson introduces a key concept.'),
          };
          const alternateFact = lessonFacts.length > 1
            ? lessonFacts[(safety + 1) % lessonFacts.length]
            : null;
          const candidate = normalizeQuestionShape(
            {
              ...buildLessonBasedQuestion(
                fact,
                alternateFact,
                context,
                normalizedQuizType,
                diff,
                questions.length + safety + requestedCount
              ),
              explanation: includeExplanations
                ? `This answer is based on the lesson content and preserves the requested question count.`
                : '',
              difficulty: diff,
              type: normalizedQuizType,
            },
            questions.length,
            diff,
            normalizedQuizType
          );
          const key = candidate.question.trim().toLowerCase();

          if (!finalSeen.has(key)) {
            const candidateSet = filterQuestionsForContext(
              [...questions, candidate],
              context,
              normalizedQuizType,
              requestedCount
            );
            if (candidateSet.length > questions.length) {
              finalSeen.add(key);
              questions = candidateSet;
            }
          }

          safety += 1;
        }
      }

      const finalQuestions = applyFinalOrdering(questions).slice(0, requestedCount);
      const validated = finalQuestions.length === requestedCount;
      if (!validated) {
        console.warn(`[WARN] Validation mismatch: generated ${finalQuestions.length}, requested ${requestedCount}`);
      }

      res.json(finalQuestions);

    } catch (error) {
      console.error(`[ERROR] Gemini SDK error:`, error);
      
      // Fallback to mock questions
      console.log('[INFO] Falling back to mock quiz generation');
      const fallbackQuestions = generateFallbackQuiz(requestedCount, context, normalizedQuizType, difficultyPlan);
      const finalQuestions = applyFinalOrdering(fallbackQuestions).slice(0, requestedCount);
      res.json(finalQuestions);
    }

  } catch (error) {
    console.error('[ERROR] Quiz generation failed:', error);
    
    // Final fallback
    const requestedCount = Math.min(200, Math.max(1, Number(req.body.count) || 1));
    const normalizedDifficulty = normalizeDifficulty(req.body.difficulty || 'medium');
    const difficultyPlan = buildDifficultyPlan(requestedCount, normalizedDifficulty);
    const context = buildQuizContext({
      topic: req.body.topic || '',
      focusDescription: req.body.focusDescription || '',
      moduleText: req.body.moduleText || '',
    });
    const fallbackQuestions = generateFallbackQuiz(
      requestedCount,
      context,
      normalizeQuizType(req.body.quizType || 'mcq'),
      difficultyPlan
    );
    const finalQuestions = (req.body.shuffleQuestions ? shuffleArray(fallbackQuestions) : fallbackQuestions).slice(0, requestedCount);
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
      answer: q.answer ?? q.correctAnswer,
      difficulty: normalizeDifficulty(q.difficulty),
      explanation: cleanText(q.explanation),
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
    const quiz = await Quiz.findByIdAndUpdate(
      quizId,
      {
        title,
        questions: (questions || []).map((q) => ({
          ...q,
          difficulty: normalizeDifficulty(q.difficulty),
          explanation: cleanText(q.explanation),
        })),
      },
      { new: true }
    );
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
