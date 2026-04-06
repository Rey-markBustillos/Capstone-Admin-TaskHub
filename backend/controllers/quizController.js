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
const listAvailableModels = async (genAI) => {
  try {
    if (!genAI || typeof genAI.listModels !== 'function') {
      return [];
    }
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
const QUIZ_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];
const QUIZ_GENERATION_CONFIG = {
  responseMimeType: 'application/json',
  temperature: 0.35,
  topP: 0.9,
  topK: 32,
  maxOutputTokens: 8192,
};
const QUIZ_SYSTEM_INSTRUCTION = `You are an expert teacher and assessment writer.
Return JSON only.
Create student-friendly quizzes that test real understanding, not topic repetition.
Never write placeholder questions, never echo the topic as the answer unless it is genuinely correct, and never use nonsense distractors.`;
let cachedWorkingModelName = '';

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
const GENERIC_QUESTION_PATTERN = /which (?:term|concept|option) is most directly connected to|identify one key term connected to|is the central focus of this lesson|topic being assessed in this quiz|key term related to|statement is related to|which is related to|write something about|write one key term related to|which option is directly related to|something about\s+[a-z0-9 _-]+/i;
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
const QUESTION_INTENT_PATTERNS = {
  application: /(scenario|during|while|real[- ]world|in practice|appl(?:y|ied|ies|ication)|best fits|most appropriate|task|situation)/i,
  usage: /(used to|used for|how do you use|when should|syntax|example|write the|tag|attribute|command)/i,
  function: /(purpose|function|role|responsible for|allows|helps|does|serves to)/i,
  definition: /(define|definition|means|stands for|refers to|described as|what term|which term)/i,
};

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

const uniqueValues = (values = []) => {
  const seen = new Set();
  return values.filter((value) => {
    const key = String(value || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildQuizModelCandidates = () =>
  uniqueValues([
    cachedWorkingModelName,
    process.env.GEMINI_MODEL,
    ...QUIZ_MODEL_CANDIDATES,
  ]);

const createQuizGenerativeModel = (genAI, modelName) =>
  genAI.getGenerativeModel({
    model: modelName,
    generationConfig: QUIZ_GENERATION_CONFIG,
    systemInstruction: QUIZ_SYSTEM_INSTRUCTION,
  });

const isGeminiProviderError = (error) => {
  const message = cleanText(error?.message || '');
  if (!message) return false;

  return /(403|401|429)\b/i.test(message) ||
    /permission denied/i.test(message) ||
    /consumer[_ ]suspended/i.test(message) ||
    /api key/i.test(message) ||
    /quota/i.test(message) ||
    /rate limit/i.test(message) ||
    /resource exhausted/i.test(message);
};

const buildGeminiFailureMessage = (error) => {
  const message = cleanText(error?.message || '');

  if (/consumer[_ ]suspended/i.test(message) || /permission denied/i.test(message) || /api key/i.test(message)) {
    return 'AI quiz generation is unavailable because the configured Gemini API key was rejected by Google. Update GEMINI_API_KEY with an active key, then restart the backend.';
  }

  if (/quota|resource exhausted|rate limit|429/i.test(message)) {
    return 'AI quiz generation is temporarily unavailable because the Gemini quota for this key has been reached. Try again later or use another active API key.';
  }

  return 'AI quiz generation is currently unavailable. Please verify the Gemini API key and model access, then try again.';
};

const resolveWorkingQuizModel = async (genAI) => {
  const modelCandidates = buildQuizModelCandidates();
  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      console.log(`[INFO] Trying model: ${modelName}`);
      const model = createQuizGenerativeModel(genAI, modelName);
      const testResult = await model.generateContent('Return exactly this JSON array: ["ok"]');
      const testText = (await testResult.response).text().trim();

      if (testText.includes('"ok"')) {
        console.log(`[SUCCESS] Model ${modelName} is working!`);
        cachedWorkingModelName = modelName;
        return { model, workingModelName: modelName };
      }
    } catch (error) {
      lastError = error;
      console.log(`[WARN] Model ${modelName} failed: ${error.message}`);
      if (isGeminiProviderError(error)) {
        return { model: null, workingModelName: null, lastError: error };
      }
    }
  }

  return { model: null, workingModelName: null, lastError };
};

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
    .slice(0, 80);
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

  return pairs.slice(0, 40);
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

  return terms.slice(0, 40);
};

const STATIC_TOPIC_FACT_BANK = [
  {
    patterns: [/\bhtml\b/i, /hypertext markup language/i],
    facts: [
      ['HTML', 'structures the content of a webpage using elements and tags'],
      ['Anchor tag', 'creates hyperlinks to another page, file, or section using the <a> element'],
      ['Paragraph tag', 'displays a paragraph of text using the <p> element'],
      ['Heading tag', 'defines headings from <h1> to <h6> to organize content'],
      ['Image tag', 'embeds an image in a webpage using the <img> element'],
      ['Attribute', 'adds extra information to an element such as href, src, alt, or class'],
      ['Form', 'collects user input using controls such as text boxes, buttons, and checkboxes'],
      ['Semantic HTML', 'uses meaningful tags like <header>, <main>, and <footer> to describe page structure'],
    ],
  },
  {
    patterns: [/\bcss\b/i, /cascading style sheets/i],
    facts: [
      ['CSS', 'controls the presentation of a webpage such as color, spacing, layout, and fonts'],
      ['Selector', 'targets the HTML element that a style rule should affect'],
      ['Property', 'names the style feature being changed such as color or margin'],
      ['Value', 'sets the chosen property such as blue, 20px, or flex'],
      ['Class selector', 'styles elements that share the same class name'],
      ['Box model', 'describes content, padding, border, and margin around an element'],
      ['Flexbox', 'arranges items in a flexible row or column layout'],
      ['Media query', 'applies styles based on screen size or device conditions'],
    ],
  },
  {
    patterns: [/\bjavascript\b/i, /\bjs\b/i, /programming/i],
    facts: [
      ['Variable', 'stores data that a program can use or change'],
      ['Function', 'groups instructions that perform a specific task when called'],
      ['Conditional statement', 'makes decisions in code based on whether a condition is true or false'],
      ['Loop', 'repeats a block of code while a condition is met'],
      ['Array', 'stores multiple values in a single ordered structure'],
      ['Object', 'stores related data as key-value pairs'],
      ['Event', 'represents an action such as a click, input, or key press'],
      ['DOM', 'lets JavaScript read and change webpage content and structure'],
    ],
  },
  {
    patterns: [/\bmath\b/i, /mathematics/i, /arithmetic/i],
    facts: [
      ['Addition', 'combines two or more numbers to find their total'],
      ['Subtraction', 'finds the difference between numbers'],
      ['Multiplication', 'shows repeated addition of equal groups'],
      ['Division', 'splits a quantity into equal groups or finds how many groups fit'],
      ['Place value', 'tells the value of a digit based on its position in a number'],
      ['Equation', 'shows that two expressions are equal'],
      ['Fraction', 'represents a part of a whole or a division of quantities'],
      ['Operation', 'is a mathematical process such as addition, subtraction, multiplication, or division'],
    ],
  },
  {
    patterns: [/\balgebra\b/i],
    facts: [
      ['Variable', 'represents an unknown or changing value'],
      ['Expression', 'combines numbers, variables, and operations without an equal sign'],
      ['Equation', 'states that two expressions are equal'],
      ['Coefficient', 'is the number multiplied by a variable'],
      ['Like terms', 'have the same variable part and can be combined'],
      ['Inequality', 'compares two expressions using symbols such as >, <, >=, or <='],
      ['Solution', 'is the value that makes an equation true'],
      ['Distributive property', 'multiplies a number across terms inside parentheses'],
    ],
  },
  {
    patterns: [/\bgeometry\b/i],
    facts: [
      ['Point', 'shows an exact location in space'],
      ['Line segment', 'is a part of a line with two endpoints'],
      ['Angle', 'is formed by two rays sharing a common endpoint'],
      ['Triangle', 'is a polygon with three sides and three angles'],
      ['Perimeter', 'is the total distance around a figure'],
      ['Area', 'measures the surface inside a two-dimensional shape'],
      ['Radius', 'is the distance from the center of a circle to its edge'],
      ['Diameter', 'is a line segment that passes through the center of a circle and touches both sides'],
    ],
  },
  {
    patterns: [/\benglish\b/i, /grammar/i, /parts of speech/i],
    facts: [
      ['Noun', 'names a person, place, thing, or idea'],
      ['Verb', 'shows an action or state of being'],
      ['Adjective', 'describes or modifies a noun or pronoun'],
      ['Adverb', 'modifies a verb, adjective, or another adverb'],
      ['Pronoun', 'takes the place of a noun'],
      ['Subject-verb agreement', 'requires the verb form to match the subject in number and person'],
      ['Synonym', 'is a word with a similar meaning to another word'],
      ['Context clue', 'helps a reader infer the meaning of an unfamiliar word from surrounding text'],
    ],
  },
  {
    patterns: [/\bfilipino\b/i, /\bwika\b/i, /pangngalan/i, /pandiwa/i, /pang-uri/i],
    facts: [
      ['Pangngalan', 'tumutukoy sa tao, hayop, bagay, lugar, o pangyayari'],
      ['Pandiwa', 'nagsasaad ng kilos o galaw'],
      ['Pang-uri', 'naglalarawan sa pangngalan o panghalip'],
      ['Panghalip', 'pumapalit sa pangngalan sa pangungusap'],
      ['Pangatnig', 'nag-uugnay ng salita, parirala, o sugnay'],
      ['Paksa', 'ang pinag-uusapan sa pangungusap'],
      ['Panaguri', 'ang bahagi ng pangungusap na nagsasabi tungkol sa paksa'],
      ['Kasingkahulugan', 'salitang may magkatulad o halos magkatulad na kahulugan'],
    ],
  },
  {
    patterns: [/\bscience\b/i, /biology/i, /chemistry/i, /physics/i],
    facts: [
      ['Cell', 'is the basic unit of life'],
      ['Photosynthesis', 'is the process plants use to make food using sunlight, water, and carbon dioxide'],
      ['Evaporation', 'changes liquid into gas due to heat'],
      ['Force', 'is a push or pull that can change an object’s motion'],
      ['Ecosystem', 'is a community of living things interacting with their environment'],
      ['Atom', 'is the basic unit of matter'],
      ['Energy', 'is the ability to do work or cause change'],
      ['Gravity', 'pulls objects toward each other, especially toward Earth'],
    ],
  },
  {
    patterns: [/\bcomputer\b/i, /\bict\b/i, /\bcpu\b/i, /\bram\b/i],
    facts: [
      ['CPU', 'processes instructions and performs calculations for the computer'],
      ['RAM', 'temporarily stores data that active programs need quickly'],
      ['Operating system', 'manages hardware resources and provides services for software'],
      ['Input device', 'sends data to the computer such as a keyboard or mouse'],
      ['Output device', 'shows processed information such as a monitor or printer'],
      ['Browser', 'opens and displays websites on the internet'],
      ['Storage device', 'keeps files and data for later use'],
      ['File', 'is a named collection of saved data'],
    ],
  },
];

const buildFactRecord = (term = '', description = '') => {
  const normalizedTerm = normalizeConceptLabel(term);
  const normalizedDescription = cleanText(description).replace(/[.?!]+$/, '');

  if (!normalizedTerm || !normalizedDescription) return null;

  return {
    term: normalizedTerm,
    description: normalizedDescription,
    sentence: `${normalizedTerm} ${lowerFirst(normalizedDescription)}.`,
  };
};

const getStaticTopicFacts = (context = {}) => {
  const haystack = [context?.topic, context?.focusDescription, context?.moduleText]
    .map((value) => cleanText(value).toLowerCase())
    .filter(Boolean)
    .join(' ');

  if (!haystack) return [];

  const matchedEntry = STATIC_TOPIC_FACT_BANK.find((entry) =>
    entry.patterns.some((pattern) => pattern.test(haystack))
  );

  if (!matchedEntry) return [];

  return matchedEntry.facts
    .map(([term, description]) => buildFactRecord(term, description))
    .filter(Boolean)
    .slice(0, 40);
};

const buildLessonFacts = (context) => {
  if (context?.definitionPairs?.length) {
    return context.definitionPairs;
  }

  const sentences = context?.lessonSentences || [];
  const conceptTerms = context?.conceptTerms || [];
  const primaryConcept = getPrimaryLessonConcept(context);
  const facts = [];
  const seen = new Set();

  sentences.forEach((sentence, index) => {
    const matchingTerm =
      conceptTerms.find((term) => sentence.toLowerCase().includes(term.toLowerCase())) ||
      conceptTerms[index % Math.max(conceptTerms.length, 1)] ||
      primaryConcept;

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

  if (facts.length > 0) {
    return facts.slice(0, 60);
  }

  return getStaticTopicFacts(context);
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
  const staticTopicFacts = getStaticTopicFacts({
    topic: resolvedTopic,
    focusDescription: cleanedFocusDescription,
    moduleText: cleanedModuleText,
  });
  const conceptTerms = uniqueValues([
    ...extractConceptTerms([cleanedTopic, cleanedFocusDescription, cleanedModuleText].join('\n'), definitionPairs, keywords),
    ...staticTopicFacts.map((fact) => fact.term),
  ]).slice(0, 16);

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

const getPrimaryLessonConcept = (context = {}) => {
  const normalizedTopic = cleanText(context?.topic).toLowerCase();
  const candidateTerms = uniqueValues([
    ...(context?.conceptTerms || []),
    ...getStaticTopicFacts(context).map((fact) => fact.term),
  ]);
  const preferred = candidateTerms.find((term) => cleanText(term).toLowerCase() !== normalizedTopic);
  return normalizeConceptLabel(preferred || candidateTerms[0] || context?.topic || 'Lesson concept');
};

const getAnswerIntent = (question = {}) => {
  const prompt = cleanText(question?.question).toLowerCase();
  return Object.entries(QUESTION_INTENT_PATTERNS).find(([, pattern]) => pattern.test(prompt))?.[0] || 'general';
};

const getQuestionConceptKey = (question = {}, context = {}) => {
  const resolvedType = normalizeQuizType(question?.type);
  const answer = normalizeConceptLabel(question?.answer || question?.correctAnswer || '').toLowerCase();

  if (resolvedType !== 'true_false' && answer) {
    return answer;
  }

  const searchableText = [
    question?.question,
    question?.explanation,
    ...(Array.isArray(question?.options) ? question.options : []),
  ]
    .map((value) => cleanText(value).toLowerCase())
    .join(' ');

  const conceptCandidates = uniqueValues([
    ...buildLessonFacts(context).map((fact) => fact.term),
    ...(context?.conceptTerms || []),
  ])
    .map((term) => normalizeConceptLabel(term))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);

  const matchedConcept = conceptCandidates.find((term) => searchableText.includes(term.toLowerCase()));
  return matchedConcept ? matchedConcept.toLowerCase() : '';
};

const isTopicEchoAnswer = (question, context = {}) => {
  const answer = cleanText(question?.answer || question?.correctAnswer).toLowerCase();
  const topic = cleanText(context?.topic).toLowerCase();
  const prompt = cleanText(question?.question).toLowerCase();

  if (!answer || !topic || answer !== topic) return false;
  if (!prompt) return true;

  const promptWithoutTopic = prompt.replace(new RegExp(`\\b${escapeRegExp(topic)}\\b`, 'g'), ' ').replace(/\s+/g, ' ').trim();
  const promptWordCount = promptWithoutTopic.split(/\s+/).filter(Boolean).length;
  const lowSignalPromptPattern = /related to|something about|key term|main topic|central focus|about the topic/i;

  return lowSignalPromptPattern.test(prompt) || promptWordCount < 5;
};

const normalizeQuizType = (value) => {
  const t = String(value || '').trim().toLowerCase();
  if (t === 'mixed') return 'mixed';
  if (t === 'true_false' || t === 'tf' || t === 'truefalse') return 'true_false';
  if (t === 'identification' || t === 'numeric' || t === 'fill_in_the_blank') return 'identification';
  return 'mcq';
};

const resolveQuestionTypeForIndex = (requestedType, index = 0) => {
  const normalizedType = normalizeQuizType(requestedType);
  if (normalizedType !== 'mixed') return normalizedType;
  return ['mcq', 'true_false', 'identification'][index % 3];
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

const isQuestionStructureValid = (question, requestedQuizType = 'mcq', context = {}) => {
  const resolvedType = normalizeQuizType(question?.type || requestedQuizType);
  const prompt = cleanText(question?.question);
  const answer = cleanText(question?.answer || question?.correctAnswer);

  if (!prompt || QUESTION_META_PATTERN.test(prompt) || GENERIC_QUESTION_PATTERN.test(prompt)) return false;
  if (isTopicEchoAnswer(question, context)) return false;

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

const filterQuestionsForContext = (
  questions,
  context,
  requestedQuizType,
  expectedCount = questions.length,
  selectedDifficulty = 'medium',
  existingQuestionDetails = []
) => {
  const signatureSeen = new Set();
  const openerCounts = new Map();
  const intentCounts = new Map();
  const conceptCounts = new Map();
  const accepted = [];
  const commonOpenerLimit = Math.max(1, Math.ceil(expectedCount / 4));
  const intentLimit = selectedDifficulty === 'hard'
    ? Math.max(1, Math.ceil(expectedCount / 2))
    : Math.max(1, Math.ceil((expectedCount + 1) / 2));
  const availableConceptCount = uniqueValues([
    ...buildLessonFacts(context).map((fact) => fact.term),
    ...(context?.conceptTerms || []),
  ]).length;
  const conceptLimit = availableConceptCount >= expectedCount
    ? 1
    : Math.max(1, Math.ceil(expectedCount / Math.max(availableConceptCount, 1)));

  (existingQuestionDetails || []).forEach((existingQuestion) => {
    const conceptKey = getQuestionConceptKey(existingQuestion, context);
    if (conceptKey) {
      conceptCounts.set(conceptKey, (conceptCounts.get(conceptKey) || 0) + 1);
    }
  });

  dedupeQuestions(questions).forEach((question) => {
    if (!isQuestionStructureValid(question, requestedQuizType, context) || !isQuestionRelevantToContext(question, context)) {
      return;
    }

    const signature = buildQuestionPatternSignature(question.question, context);
    if (signatureSeen.has(signature)) return;

    const opener = extractQuestionOpener(question.question);
    const openerCount = openerCounts.get(opener) || 0;
    if (COMMON_QUESTION_OPENERS.has(opener) && openerCount >= commonOpenerLimit) {
      return;
    }

    const intent = getAnswerIntent(question);
    const currentIntentCount = intentCounts.get(intent) || 0;
    if (intent !== 'general' && currentIntentCount >= intentLimit) {
      return;
    }

    const conceptKey = getQuestionConceptKey(question, context);
    const currentConceptCount = conceptKey ? (conceptCounts.get(conceptKey) || 0) : 0;
    if (conceptKey && availableConceptCount > 1 && currentConceptCount >= conceptLimit) {
      return;
    }

    signatureSeen.add(signature);
    openerCounts.set(opener, openerCount + 1);
    intentCounts.set(intent, currentIntentCount + 1);
    if (conceptKey) {
      conceptCounts.set(conceptKey, currentConceptCount + 1);
    }
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

const buildFactExplanation = (fact, fallbackAnswer = '') => {
  const normalizedFallbackAnswer = cleanText(fallbackAnswer);
  const answerLabel = /^(true|false)$/i.test(normalizedFallbackAnswer)
    ? normalizeConceptLabel(fact?.term || '')
    : normalizeConceptLabel(fallbackAnswer || fact?.term || '');
  const description = cleanText(fact?.description || '').replace(/[.?!]+$/, '');

  if (answerLabel && description) {
    return `${answerLabel} ${lowerFirst(description)}.`;
  }

  if (description) {
    return `${upperFirst(description)}.`;
  }

  return 'This answer matches the lesson concept being assessed.';
};

const PREDICATE_START_PATTERN = /^(adds|allows|arranges|changes|collects|combines|compares|controls|creates|defines|describes|displays|embeds|explains|finds|groups|helps|keeps|lets|links|manages|measures|modifies|moves|names|opens|organizes|processes|provides|pulls|repeats|represents|requires|sends|shows|splits|stores|structures|styles|targets|tells|uses|writes|tumutukoy|nagsasaad|naglalarawan|pumapalit|nag-uugnay|is|are|means|refers to|stands for)\b/i;

const buildPredicateClause = (description = '') => {
  const cleanedDescription = cleanText(description).replace(/[.?!]+$/, '');
  if (!cleanedDescription) return 'is part of the lesson';
  return PREDICATE_START_PATTERN.test(cleanedDescription)
    ? lowerFirst(cleanedDescription)
    : `is ${lowerFirst(cleanedDescription)}`;
};

const buildLessonBasedQuestion = (fact, alternateFact, context, questionType, difficulty, index) => {
  const cleanDescription = cleanText(fact.description).replace(/[.?!]+$/, '');
  const predicateClause = buildPredicateClause(cleanDescription);
  const correctTerm = normalizeConceptLabel(fact.term);

  if (questionType === 'true_false') {
    if (alternateFact && index % 2 === 1) {
      return {
        question: `The lesson states that ${correctTerm} ${buildPredicateClause(alternateFact.description)}.`,
        correctAnswer: 'False',
      };
    }

    const hardTemplate = [
      `${correctTerm} ${predicateClause}.`,
      `The lesson explains that ${correctTerm} ${predicateClause}.`,
      `A student is working with a concept that ${predicateClause}. That concept is ${correctTerm}.`,
      `${correctTerm} is one lesson concept that ${predicateClause}.`,
    ];

    return {
      question: hardTemplate[index % hardTemplate.length],
      correctAnswer: 'True',
    };
  }

  if (questionType === 'identification') {
    const identificationTemplates = difficulty === 'hard'
      ? [
          `A learner needs a concept that ${predicateClause}. Write the correct term.`,
          `During a class activity, students use a concept that ${predicateClause}. Name that concept.`,
          `The lesson describes a term that ${predicateClause}. Identify it.`,
          `In a real classroom task, what lesson term ${predicateClause}?`,
        ]
      : difficulty === 'medium'
        ? [
            `Name the concept that ${predicateClause}.`,
            `Identify the term that ${predicateClause}.`,
            `Write the lesson term that ${predicateClause}.`,
            `Which lesson concept ${predicateClause}?`,
          ]
        : [
            `Give the term that ${predicateClause}.`,
            `Name the concept that ${predicateClause}.`,
            `Identify the lesson term that ${predicateClause}.`,
            `What term ${predicateClause}?`,
          ];

    return {
      question: identificationTemplates[index % identificationTemplates.length],
      correctAnswer: correctTerm,
    };
  }

  const distractors = buildPlausibleDistractors(context, correctTerm, 3);
  const mcqTemplates = difficulty === 'hard'
    ? [
        `A learner needs a concept that ${predicateClause}. Which concept should be applied?`,
        `During a performance task, students use something that ${predicateClause}. Select the most appropriate concept.`,
        `A teacher presents a situation involving a concept that ${predicateClause}. Which concept best fits?`,
        `In a real-world use case, which concept ${predicateClause}?`,
      ]
    : difficulty === 'medium'
      ? [
          `The lesson explains a concept that ${predicateClause}. What is that concept?`,
          `A student is looking for a concept that ${predicateClause}. Which lesson concept should the student use?`,
          `Choose the concept that best matches this function: ${cleanDescription}.`,
          `Which lesson concept ${predicateClause}?`,
        ]
      : [
          `Choose the term that ${predicateClause}.`,
          `The lesson defines a concept that ${predicateClause}. Which term matches that definition?`,
          `From the lesson definitions, which concept ${predicateClause}?`,
          `Which term in the lesson ${predicateClause}?`,
        ];

  return {
    question: mcqTemplates[index % mcqTemplates.length],
    options: shuffleArray([correctTerm, ...distractors]).slice(0, 4),
    correctAnswer: correctTerm,
  };
};

// Add fallback quiz generation with topic-specific questions
const generateFallbackQuiz = (count, context, quizType, difficultyPlan = [], existingQuestionDetails = []) => {
  const normalizedType = normalizeQuizType(quizType);
  const topic = context?.topic || extractFocusTopic(context?.moduleText || '');
  const focusLabel = context?.focusDescription || topic;
  const usedConcepts = new Set(
    (existingQuestionDetails || [])
      .map((question) => getQuestionConceptKey(question, context))
      .filter(Boolean)
  );
  const lessonFacts = (() => {
    const facts = buildLessonFacts(context);
    if (!usedConcepts.size) return facts;
    const unusedFacts = facts.filter((fact) => !usedConcepts.has(normalizeConceptLabel(fact.term).toLowerCase()));
    const usedFacts = facts.filter((fact) => usedConcepts.has(normalizeConceptLabel(fact.term).toLowerCase()));
    return [...unusedFacts, ...usedFacts];
  })();
  const questions = [];
  const difficultyForIndex = (i) => difficultyPlan[i] || 'medium';

  for (let i = 0; i < count; i++) {
    let generated;
    const questionTypeForIndex = resolveQuestionTypeForIndex(normalizedType, i);
    let supportingFact = lessonFacts[i % Math.max(lessonFacts.length, 1)] || null;

    if (topic === 'fractions') {
      if (questionTypeForIndex === 'true_false') generated = generateFractionTrueFalse(i);
      else if (questionTypeForIndex === 'identification') generated = generateFractionIdentification(i);
      else generated = generateFractionMcq(i);
    } else if (topic === 'mathematics' || topic === 'algebra' || topic === 'geometry') {
      const seed = i + 2;
      if (questionTypeForIndex === 'true_false') {
        generated = {
          question: `${seed} + ${seed} is equal to ${seed * 2}.`,
          correctAnswer: 'True',
        };
      } else if (questionTypeForIndex === 'identification') {
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
        term: getPrimaryLessonConcept(context) || upperFirst(topic || 'Lesson concept'),
        description: cleanText(focusLabel || topic || 'the core concept discussed in the lesson'),
        sentence: cleanText(focusLabel || topic || 'The lesson introduces a core concept.'),
      };
      supportingFact = lessonFact;
      const alternateFact = lessonFacts.length > 1
        ? lessonFacts[(i + 1) % lessonFacts.length]
        : null;
        generated = buildLessonBasedQuestion(
          lessonFact,
          alternateFact,
          context,
          questionTypeForIndex,
          difficultyForIndex(i),
          i
        );
    }

    questions.push(
      normalizeQuestionShape(
        {
          ...generated,
          explanation: buildFactExplanation(
            supportingFact || buildFactRecord(generated?.correctAnswer || generated?.answer || focusLabel, focusLabel || topic),
            generated?.correctAnswer || generated?.answer
          ),
          difficulty: difficultyForIndex(i),
          type: questionTypeForIndex,
        },
        i,
        difficultyForIndex(i),
        questionTypeForIndex
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
  existingQuestionDetails = [],
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
  const existingConcepts = uniqueValues(
    (existingQuestionDetails || [])
      .map((question) => getQuestionConceptKey(question, context) || cleanText(question?.answer || question?.correctAnswer))
      .filter(Boolean)
  );
  const usedConceptContext = existingConcepts.length > 0
    ? `\nALREADY USED LESSON CONCEPTS / ANSWERS (do not reuse these unless the lesson is too short):\n${existingConcepts.map((concept, index) => `${index + 1}. ${concept}`).join('\n')}\n`
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
    .slice(0, 12)
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
- NEVER use the main topic word by itself as the answer unless the lesson truly requires that exact term and there is no narrower concept available.
- Do not repeat or paraphrase another question.
- Do not reuse the same lesson concept or same correct answer in multiple questions when there are enough other concepts in the lesson.
- Do not overuse the same question opener or structure. Mix definition, interpretation, comparison, scenario, and application styles.
- Use real lesson knowledge. Questions should test understanding, not just mention the topic.
- When the question count allows it, include a healthy mix of: definition, function, usage, and real-world application.
- Multiple-choice distractors must be plausible, lesson-related, and academically realistic.
- Easy questions should focus on basic definitions or recognition.
- Medium questions should test understanding, function, and usage.
- Hard questions should use application, analysis, or short scenario-based reasoning.
- difficulty must always be "${normalizedDifficulty}".${explanationRule}${typeRules}${existingContext}${usedConceptContext}`;
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
      existingQuestionDetails = [],
      includeExplanations = true,
      shuffleQuestions = false,
    } = req.body;
    const requestedCount = Math.min(200, Math.max(1, Number(count) || 1));
    const normalizedQuizType = normalizeQuizType(quizType);
    const normalizedDifficulty = normalizeDifficulty(difficulty);
    const difficultyPlan = buildDifficultyPlan(requestedCount, normalizedDifficulty);
    const context = buildQuizContext({ topic, focusDescription, moduleText });
    const applyFinalOrdering = (items) => (shuffleQuestions ? shuffleArray(items) : items);
    const existingQuestionPrompts = uniqueValues([
      ...(Array.isArray(existingQuestions) ? existingQuestions : []),
      ...(Array.isArray(existingQuestionDetails) ? existingQuestionDetails.map((question) => question?.question) : []),
    ].filter(Boolean));

    console.log('[INFO] Quiz generation request received:', {
      requestedCount,
      topic: context.topic,
      quizType: normalizedQuizType,
      difficulty: normalizedDifficulty,
      hasModuleText: Boolean(context.moduleText),
    });
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message: 'AI quiz generation is unavailable because GEMINI_API_KEY is not configured on the backend.',
      });
    }

    console.log(`[INFO] GEMINI_API_KEY exists: ${!!process.env.GEMINI_API_KEY}`);

    console.log(`[INFO] Initializing Gemini SDK...`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // First, let's see what models are available
    await listAvailableModels(genAI);
    const { model, workingModelName, lastError } = await resolveWorkingQuizModel(genAI);

    if (!model || !workingModelName) {
      if (isGeminiProviderError(lastError)) {
        return res.status(503).json({
          message: buildGeminiFailureMessage(lastError),
        });
      }

      return res.status(503).json({
        message: 'AI quiz generation is unavailable because no supported Gemini model could be initialized for this backend.',
      });
    }

    console.log(`[INFO] Using working model: ${workingModelName}`);

    // Continue with quiz generation...
    const prompt = createQuizPrompt(
      requestedCount,
      context,
      normalizedDifficulty,
      normalizedQuizType,
      existingQuestionPrompts,
      existingQuestionDetails,
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
        requestedCount,
        normalizedDifficulty,
        existingQuestionDetails
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
          const generatedQuestionDetails = questions.map((question) => ({
            question: question.question,
            answer: question.answer,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            type: question.type,
          }));
          const remainingDifficultyPlan = difficultyPlan.slice(questions.length, requestedCount);
          const retryPrompt = createQuizPrompt(
            missing,
            context,
            normalizedDifficulty,
            normalizedQuizType,
            [...existingQuestionPrompts, ...alreadyGenerated],
            [...existingQuestionDetails, ...generatedQuestionDetails],
            remainingDifficultyPlan,
            includeExplanations
          );
          const retryResult = await model.generateContent(retryPrompt);
          const retryText = (await retryResult.response).text();
          const moreQuestions = filterQuestionsForContext(
            parseQuizResponse(retryText, normalizedQuizType, remainingDifficultyPlan),
            context,
            normalizedQuizType,
            requestedCount,
            normalizedDifficulty,
            [...existingQuestionDetails, ...generatedQuestionDetails]
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
        const supplement = generateFallbackQuiz(
          missing,
          context,
          normalizedQuizType,
          supplementPlan,
          [
            ...existingQuestionDetails,
            ...questions.map((question) => ({
              question: question.question,
              answer: question.answer,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
              type: question.type,
            })),
          ]
        );
        questions = filterQuestionsForContext(
          [...questions, ...supplement],
          context,
          normalizedQuizType,
          requestedCount,
          normalizedDifficulty,
          existingQuestionDetails
        );
      }

      if (questions.length < requestedCount) {
        // Final deterministic lesson-based backfill to guarantee exact count.
        const finalSeen = new Set(questions.map((q) => q.question.trim().toLowerCase()));
        const lessonFacts = buildLessonFacts(context);
        let i = 0;
        while (questions.length < requestedCount) {
          const diff = difficultyPlan[questions.length] || normalizedDifficulty;
          const questionTypeForIndex = resolveQuestionTypeForIndex(normalizedQuizType, questions.length + i);
          const fact = lessonFacts[i % Math.max(lessonFacts.length, 1)] || {
            term: getPrimaryLessonConcept(context) || upperFirst(context.topic || 'Lesson concept'),
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
                questionTypeForIndex,
                diff,
                questions.length + i
              ),
              explanation: includeExplanations
                ? buildFactExplanation(fact)
                : '',
              difficulty: diff,
              type: questionTypeForIndex,
            },
            questions.length,
            diff,
            questionTypeForIndex
          );
          const key = forced.question.trim().toLowerCase();
          if (!finalSeen.has(key) && isQuestionStructureValid(forced, normalizedQuizType, context)) {
            finalSeen.add(key);
            questions.push(forced);
          }
          i += 1;
          if (i > requestedCount * 3) break;
        }
      }

      questions = filterQuestionsForContext(
        questions,
        context,
        normalizedQuizType,
        requestedCount,
        normalizedDifficulty,
        existingQuestionDetails
      );

      if (questions.length < requestedCount) {
        const lessonFacts = buildLessonFacts(context);
        const finalSeen = new Set(questions.map((q) => q.question.trim().toLowerCase()));
        let safety = 0;

        while (questions.length < requestedCount && safety < requestedCount * 6) {
          const diff = difficultyPlan[questions.length] || normalizedDifficulty;
          const questionTypeForIndex = resolveQuestionTypeForIndex(normalizedQuizType, questions.length + safety);
          const fact = lessonFacts[safety % Math.max(lessonFacts.length, 1)] || {
            term: getPrimaryLessonConcept(context) || upperFirst(context.topic || 'Lesson concept'),
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
                questionTypeForIndex,
                diff,
                questions.length + safety + requestedCount
              ),
              explanation: includeExplanations
                ? buildFactExplanation(fact)
                : '',
              difficulty: diff,
              type: questionTypeForIndex,
            },
            questions.length,
            diff,
            questionTypeForIndex
          );
          const key = candidate.question.trim().toLowerCase();

          if (!finalSeen.has(key)) {
            const candidateSet = filterQuestionsForContext(
              [...questions, candidate],
              context,
              normalizedQuizType,
              requestedCount,
              normalizedDifficulty,
              existingQuestionDetails
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

      if (isGeminiProviderError(error)) {
        return res.status(503).json({
          message: buildGeminiFailureMessage(error),
        });
      }
      
      // Fallback to mock questions
      console.log('[INFO] Falling back to mock quiz generation');
      const fallbackQuestions = generateFallbackQuiz(
        requestedCount,
        context,
        normalizedQuizType,
        difficultyPlan,
        existingQuestionDetails
      );
      const finalQuestions = applyFinalOrdering(fallbackQuestions).slice(0, requestedCount);
      res.json(finalQuestions);
    }

  } catch (error) {
    console.error('[ERROR] Quiz generation failed:', error);

    if (isGeminiProviderError(error)) {
      return res.status(503).json({
        message: buildGeminiFailureMessage(error),
      });
    }
    
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
      difficultyPlan,
      req.body.existingQuestionDetails || []
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
