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

// Add fallback quiz generation with topic-specific questions
const generateFallbackQuiz = (count, moduleText, quizType) => {
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

  // Generate questions based on available topic questions
  for (let i = 0; i < count; i++) {
    const questionIndex = i % topicQuestions.length;
    const selectedQuestion = topicQuestions[questionIndex];
    
    if (quizType === 'mcq' || quizType === 'multiple_choice') {
      questions.push({
        type: 'mcq',
        displayType: 'Multiple Choice',
        question: selectedQuestion.question,
        options: selectedQuestion.options,
        answer: selectedQuestion.answer
      });
    } else if (quizType === 'true_false') {
      questions.push({
        type: 'true_false',
        displayType: 'True/False',
        question: `True or False: ${selectedQuestion.question.replace('?', '')}`,
        options: ['True', 'False'],
        answer: Math.random() > 0.5 ? 'True' : 'False'
      });
    } else if (quizType === 'identification') {
      questions.push({
        type: 'identification',
        displayType: 'Identification',
        question: selectedQuestion.question,
        options: [],
        answer: selectedQuestion.answer
      });
    }
  }

  return questions;
};

// Create quiz prompt for Gemini
const createQuizPrompt = (count, moduleText, difficulty, quizType) => {
  let typePrompt = '';
  if (quizType === 'mcq') typePrompt = 'multiple choice';
  else if (quizType === 'true_false') typePrompt = 'true or false';
  else if (quizType === 'identification') typePrompt = 'identification';
  else typePrompt = 'mixed types';

  if (moduleText && moduleText.trim()) {
    return `Generate ${count} quiz questions (${typePrompt}) based on this text. Respond as a JSON array of objects with: type, question, options (array), answer.\nText:\n${moduleText}`;
  } else {
    return `Generate ${count} quiz questions (${typePrompt}) for a general subject. Respond as a JSON array of objects with: type, question, options (array), answer.`;
  }
};

// Parse quiz response from Gemini
const parseQuizResponse = (text, quizType) => {
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
      return questions.map(q => {
        let type = q.type;
        if (q.type === 'multiple_choice') type = 'mcq';
        
        let displayType = 'Identification';
        if (type === 'mcq') displayType = 'Multiple Choice';
        else if (type === 'true_false') displayType = 'True/False';
        
        return {
          ...q,
          type,
          displayType
        };
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
    const { count = 3, moduleText, difficulty = 'medium', quizType = 'mcq' } = req.body;

    console.log(`[INFO] Quiz generation request received:`, { count, moduleText, quizType });
    
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
      const fallbackQuestions = generateFallbackQuiz(count, moduleText, quizType);
      return res.json({ questions: fallbackQuestions });
    }

    console.log(`[INFO] Using working model: ${workingModelName}`);

    // Continue with quiz generation...
    const prompt = createQuizPrompt(count, moduleText, difficulty, quizType);
    console.log(`[INFO] Generated prompt for Gemini API`);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`[INFO] Received response from Gemini API`);
      
      const questions = parseQuizResponse(text, quizType);
      console.log(`[INFO] Successfully parsed ${questions.length} questions`);
      
      if (questions.length === 0) {
        throw new Error('No valid questions could be parsed from Gemini response');
      }

      res.json({ questions });

    } catch (error) {
      console.error(`[ERROR] Gemini SDK error:`, error);
      
      // Fallback to mock questions
      console.log('[INFO] Falling back to mock quiz generation');
      const fallbackQuestions = generateFallbackQuiz(count, moduleText, quizType);
      res.json({ questions: fallbackQuestions });
    }

  } catch (error) {
    console.error('[ERROR] Quiz generation failed:', error);
    
    // Final fallback
    const fallbackQuestions = generateFallbackQuiz(req.body.count || 3, req.body.moduleText || '', req.body.quizType || 'mcq');
    res.json({ questions: fallbackQuestions });
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
