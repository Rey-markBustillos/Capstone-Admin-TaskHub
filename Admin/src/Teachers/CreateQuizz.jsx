import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaUpload, FaPaste, FaTrash, FaEdit, FaPlus, FaSave, FaTimes, FaFileWord, FaDownload } from 'react-icons/fa';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

const showAlert = (icon, title, text) =>
  Swal.fire({
    icon,
    title,
    text,
    confirmButtonColor: '#2563eb',
  });

const showConfirm = async (title, text) => {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
  });
  return result.isConfirmed;
};

const QUIZ_TYPE_LABELS = {
  mixed: 'Mixed Type',
  mcq: 'Multiple Choice',
  true_false: 'True/False',
  identification: 'Identification',
};

const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const normalizeQuestionType = (value) => {
  const type = String(value || '').trim().toLowerCase();
  if (type === 'true_false' || type === 'tf' || type === 'truefalse') return 'true_false';
  if (type === 'identification' || type === 'numeric' || type === 'fill_in_the_blank') return 'identification';
  return 'mcq';
};

const shuffleItems = (items) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const createBlankQuestion = (type = 'mcq', difficulty = 'medium') => {
  const normalizedType = normalizeQuestionType(type);

  if (normalizedType === 'true_false') {
    return {
      type: 'true_false',
      displayType: 'True/False',
      question: '',
      options: ['True', 'False'],
      answer: 'True',
      correctAnswer: 'True',
      explanation: '',
      difficulty,
    };
  }

  if (normalizedType === 'identification') {
    return {
      type: 'identification',
      displayType: 'Identification',
      question: '',
      options: [],
      answer: '',
      correctAnswer: '',
      explanation: '',
      difficulty,
    };
  }

  return {
    type: 'mcq',
    displayType: 'Multiple Choice',
    question: '',
    options: ['', '', '', ''],
    answer: '',
    correctAnswer: '',
    explanation: '',
    difficulty,
  };
};

const normalizeEditableQuestion = (question, fallbackDifficulty = 'medium') => {
  const normalizedType = normalizeQuestionType(question?.type);
  const difficulty = String(question?.difficulty || fallbackDifficulty || 'medium').trim().toLowerCase() || 'medium';
  const explanation = String(question?.explanation || '').trim();
  const prompt = String(question?.question || '').trim();

  if (normalizedType === 'true_false') {
    const answer = String(question?.answer || question?.correctAnswer || 'True').trim().toLowerCase() === 'false' ? 'False' : 'True';
    return {
      ...question,
      type: 'true_false',
      displayType: 'True/False',
      question: prompt,
      options: ['True', 'False'],
      answer,
      correctAnswer: answer,
      explanation,
      difficulty,
    };
  }

  if (normalizedType === 'identification') {
    const answer = String(question?.answer || question?.correctAnswer || '').trim();
    return {
      ...question,
      type: 'identification',
      displayType: 'Identification',
      question: prompt,
      options: [],
      answer,
      correctAnswer: answer,
      explanation,
      difficulty,
    };
  }

  const rawOptions = Array.isArray(question?.options)
    ? question.options
    : String(question?.options || '').split('\n');
  const cleanedOptions = rawOptions
    .map((option) => String(option || '').trim())
    .filter(Boolean);

  const uniqueOptions = [];
  const seen = new Set();
  cleanedOptions.forEach((option) => {
    const key = option.toLowerCase();
    if (!seen.has(key) && uniqueOptions.length < 4) {
      seen.add(key);
      uniqueOptions.push(option);
    }
  });

  while (uniqueOptions.length < 4) {
    uniqueOptions.push(`Option ${String.fromCharCode(65 + uniqueOptions.length)}`);
  }

  const answerCandidate = String(question?.answer || question?.correctAnswer || '').trim();
  const answer = uniqueOptions.find((option) => option.toLowerCase() === answerCandidate.toLowerCase()) || uniqueOptions[0];

  return {
    ...question,
    type: 'mcq',
    displayType: 'Multiple Choice',
    question: prompt,
    options: uniqueOptions.slice(0, 4),
    answer,
    correctAnswer: answer,
    explanation,
    difficulty,
  };
};

const createSafeFilename = (value) =>
  String(value || 'Quiz')
    .trim()
    .split('')
    .filter((character) => character >= ' ' && !/[<>:"/\\|?*]/.test(character))
    .join('')
    .replace(/\s+/g, '_') || 'Quiz';

const EXCEL_THEME = {
  primary: "4F46E5", // Indigo
  secondary: "10B981", // Emerald
  title: "2C3E50", // Midnight Blue
  headerBg: "F3F4F6", // Cool Gray 100
  headerText: "111827", // Cool Gray 900
  rowAlt: "F9FAFB", // Gray 50
  rowBase: "FFFFFF",
  border: "BDC3C7", // Silver
  white: "FFFFFF",
};

const buildExcelBorder = (weight = "thin", color = EXCEL_THEME.border) => ({
  top: { style: weight, color: { rgb: color } },
  bottom: { style: weight, color: { rgb: color } },
  left: { style: weight, color: { rgb: color } },
  right: { style: weight, color: { rgb: color } },
});

const buildExcelStyle = ({
  font = {},
  fillColor,
  align = "left",
  vertical = "center",
  bold = false,
  size = 11,
  color = EXCEL_THEME.headerText,
  wrapText = false,
  border,
  numFmt,
} = {}) => {
  const style = {
    font: { name: "Calibri", sz: size, bold, color: { rgb: color }, ...font },
    alignment: { horizontal: align, vertical, wrapText },
  };

  if (border) {
    style.border = border;
  }

  if (fillColor) {
    style.fill = {
      patternType: "solid",
      fgColor: { rgb: fillColor },
    };
  }

  if (numFmt) {
    style.numFmt = numFmt;
  }

  return style;
};

const setWorksheetCellStyle = (worksheet, rowIndex, columnIndex, style) => {
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
  if (!worksheet[address]) {
    XLSX.utils.sheet_add_aoa(worksheet, [[null]], { origin: address });
  }
  worksheet[address].s = style;
};

export default function CreateQuizz() {
  // Always initialize params and user info first
  const { classId } = useParams();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user?._id;
  // State for created quizzes and their submissions
  const [createdQuizzes, setCreatedQuizzes] = useState([]);
  const [submissionsByQuiz, setSubmissionsByQuiz] = useState({});
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState('');
  const [showSubModal, setShowSubModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  // Fetch quizzes created by this teacher for this class
  useEffect(() => {
    if (!classId || !teacherId) return;
    const fetchCreatedQuizzes = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/quizzes/class/${classId}`);
        const filtered = res.data.filter(q => q.createdBy === teacherId);
        setCreatedQuizzes(filtered);
      } catch {
        setCreatedQuizzes([]);
      }
    };
    fetchCreatedQuizzes();
  }, [classId, teacherId]);

  // Fetch submissions for each created quiz
  useEffect(() => {
    if (!createdQuizzes.length) return;
    setSubLoading(true);
    setSubError('');
    const fetchAll = async () => {
      const results = {};
      for (const quiz of createdQuizzes) {
        try {
          const res = await axios.get(`${API_BASE_URL}/quizzes/${quiz._id}/submissions`);
          results[quiz._id] = res.data || [];
        } catch {
          results[quiz._id] = [];
        }
      }
      setSubmissionsByQuiz(results);
      setSubLoading(false);
    };
    fetchAll();
  }, [createdQuizzes]);

  const [topic, setTopic] = useState('');
  const [focusDescription, setFocusDescription] = useState('');
  const [moduleText, setModuleText] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editQ, setEditQ] = useState({});
  const [quizType, setQuizType] = useState('mixed');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [questionTime, setQuestionTime] = useState(30);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  // Mixed quiz type counts
  const [mcqCount, setMcqCount] = useState(2);
  const [trueFalseCount, setTrueFalseCount] = useState(2);
  const [identificationCount, setIdentificationCount] = useState(1);
  // const [isProcessingFile, setIsProcessingFile] = useState(false);
  // const [selectedQuizId, setSelectedQuizId] = useState(null);
  // const [showCreatedQuizzes, setShowCreatedQuizzes] = useState(false);
  // const [showSubmissions, setShowSubmissions] = useState(false);
  // Fetch quizzes created by this teacher for this class
  // useEffect(() => {
  //   const fetchCreatedQuizzes = async () => {
  //     if (!classId) return;
  //     try {
  //       const res = await axios.get(`${API_BASE_URL}/quizzes/class/${classId}`);
  //       const filtered = res.data.filter(q => q.createdBy === teacherId);
  //       setCreatedQuizzes(filtered);
  //       // Set default selected quiz for submissions modal
  //       if (filtered.length > 0 && !selectedQuizId) {
  //         setSelectedQuizId(filtered[0]._id);
  //       }
  //     } catch {
  //       setCreatedQuizzes([]);
  //     }
  //   };
  //   fetchCreatedQuizzes();
  // }, [classId, teacherId, selectedQuizId]);

  // Handle file upload - only supports text files for simplicity
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Support multiple file types for educational content
    const allowedTypes = [
      'text/plain', // .txt
      'application/pdf', // .pdf
      'image/jpeg', // .jpg
      'image/jpg', 
      'image/png', // .png
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint' // .ppt
    ];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['txt', 'pdf', 'jpg', 'jpeg', 'png', 'docx', 'doc', 'pptx', 'ppt'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      showAlert('warning', 'Unsupported File Type', `Please upload: ${allowedExtensions.join(', ')} files`);
      e.target.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit for all file types
      showAlert('warning', 'File Too Large', 'Maximum file size is 50MB.');
      e.target.value = '';
      return;
    }

    // setIsProcessingFile(true);

    try {
      if (file.type === 'text/plain' || fileExtension === 'txt') {
        // Handle text files directly
        const text = await file.text();
        setModuleText(text);
        showAlert('success', 'Text Loaded', `${text.length} characters imported successfully.`);
      } else {
        // Handle other file types using backend AI processing
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_BASE_URL}/file/extract-text`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minutes
        });

        if (response.data && response.data.text) {
          setModuleText(response.data.text);
          showAlert('success', 'Extraction Complete', `Extracted ${response.data.text.length} characters from ${response.data.originalFileName}.`);
        } else {
          throw new Error('Failed to extract text from file');
        }
      }
    } catch (error) {
      let errorMessage = 'Failed to process file. Please try again or use a different file.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'File processing timed out. Please try a smaller file or convert to text format.';
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large. Please try a smaller file (max 50MB).';
      } else if (error.response?.status === 400) {
        errorMessage = `File processing error: ${error.response.data.message || 'Invalid file format'}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      showAlert('error', 'File Processing Failed', errorMessage);
    } finally {
      // setIsProcessingFile(false);
      e.target.value = ''; // Reset file input
    }
  };

  // Generate quiz questions from topic, focus, and optional reference material
  const handleGenerate = async () => {
    if (!topic.trim()) {
      await showAlert('warning', 'Topic Required', 'Enter a topic or subject before generating a quiz.');
      return;
    }

    if (count < 1) {
      await showAlert('warning', 'Invalid Number', 'Enter a valid number of questions.');
      return;
    }

    if (quizType === 'mixed') {
      const totalMixed = mcqCount + trueFalseCount + identificationCount;
      if (totalMixed === 0) {
        await showAlert('warning', 'No Mixed Questions Set', 'Please specify at least one question for mixed type quiz.');
        return;
      }
      if (totalMixed > count) {
        await showAlert('warning', 'Mixed Count Exceeds Total', 'Increase total questions or reduce per-type counts.');
        return;
      }
    }

    setLoading(true);
    try {
      let allQuestions = [];
      const generationPayload = {
        topic: topic.trim(),
        focusDescription: focusDescription.trim() || undefined,
        moduleText: moduleText.trim() || undefined,
        difficulty,
        includeExplanations,
      };

      if (quizType === 'mixed') {
        const requestedTotal = count;
        const baseCounts = {
          mcq: mcqCount,
          true_false: trueFalseCount,
          identification: identificationCount,
        };
        const selectedTypes = Object.entries(baseCounts)
          .filter(([, value]) => value > 0)
          .map(([type]) => type);

        const targetCounts = { ...baseCounts };
        let remaining = requestedTotal - (mcqCount + trueFalseCount + identificationCount);
        if (remaining > 0 && selectedTypes.length > 0) {
          let pointer = 0;
          while (remaining > 0) {
            const typeKey = selectedTypes[pointer % selectedTypes.length];
            targetCounts[typeKey] += 1;
            remaining -= 1;
            pointer += 1;
          }
        }

        let collectedQuestions = [];
        const buildExistingQuestionDetails = () =>
          collectedQuestions.map((question) => ({
            question: question.question,
            answer: question.correctAnswer || question.answer,
            correctAnswer: question.correctAnswer || question.answer,
            explanation: question.explanation,
            type: question.type,
          }));

        if (targetCounts.mcq > 0) {
          const res = await axios.post(`${API_BASE_URL}/quizzes/generate`, {
            count: targetCounts.mcq,
            ...generationPayload,
            quizType: 'mcq',
            shuffleQuestions: false,
            existingQuestions: collectedQuestions.map((q) => q.question),
            existingQuestionDetails: buildExistingQuestionDetails(),
          });
          const generated = Array.isArray(res.data) ? res.data : res.data?.questions;
          if (Array.isArray(generated)) {
            collectedQuestions = [...collectedQuestions, ...generated];
          }
        }

        if (targetCounts.true_false > 0) {
          const res = await axios.post(`${API_BASE_URL}/quizzes/generate`, {
            count: targetCounts.true_false,
            ...generationPayload,
            quizType: 'true_false',
            shuffleQuestions: false,
            existingQuestions: collectedQuestions.map((q) => q.question),
            existingQuestionDetails: buildExistingQuestionDetails(),
          });
          const generated = Array.isArray(res.data) ? res.data : res.data?.questions;
          if (Array.isArray(generated)) {
            collectedQuestions = [...collectedQuestions, ...generated];
          }
        }

        if (targetCounts.identification > 0) {
          const res = await axios.post(`${API_BASE_URL}/quizzes/generate`, {
            count: targetCounts.identification,
            ...generationPayload,
            quizType: 'identification',
            shuffleQuestions: false,
            existingQuestions: collectedQuestions.map((q) => q.question),
            existingQuestionDetails: buildExistingQuestionDetails(),
          });
          const generated = Array.isArray(res.data) ? res.data : res.data?.questions;
          if (Array.isArray(generated)) {
            collectedQuestions = [...collectedQuestions, ...generated];
          }
        }

        const seen = new Set();
        allQuestions = collectedQuestions.filter((q) => {
          const key = String(q.question || '').toLowerCase().trim();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      } else {
        const response = await axios.post(`${API_BASE_URL}/quizzes/generate`, {
          count,
          ...generationPayload,
          quizType,
          shuffleQuestions,
        });

        const generated = Array.isArray(response.data) ? response.data : response.data?.questions;
        if (Array.isArray(generated)) {
          allQuestions = generated;
        }
      }

      if (allQuestions.length > 0) {
        const seen = new Set();
        const uniqueQuestions = allQuestions
          .map((question) => normalizeEditableQuestion(question, difficulty))
          .filter((question) => String(question.question || '').trim())
          .filter((question) => {
            const key = question.question.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, count);

        if (uniqueQuestions.length !== count) {
          await showAlert('warning', 'Generation Incomplete', `The generator returned ${uniqueQuestions.length} of ${count} requested questions. Please regenerate for a complete set.`);
        }

        setQuestions(shuffleQuestions ? shuffleItems(uniqueQuestions) : uniqueQuestions);
        setEditingIdx(null);
        setEditQ({});
        setTitle((currentTitle) => currentTitle || `${topic.trim()} Quiz`);
      } else {
        showAlert('info', 'No Questions Generated', 'Try refining the topic, adding a focus description, or pasting reference material.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate quiz. Please try again.';
      showAlert('error', 'Generation Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (questions.length > 0) {
      const confirmed = await showConfirm('Regenerate Quiz?', 'Your current generated questions will be replaced.');
      if (!confirmed) {
        return;
      }
    }

    await handleGenerate();
  };

  // Edit, delete, save question
  const handleEdit = (idx) => {
    setEditingIdx(idx);
    setEditQ({ ...questions[idx] });
  };

  const handleEditChange = (field, value) => {
    setEditQ((q) => ({ ...q, [field]: value }));
  };

  const handleSaveEdit = () => {
    const normalizedQuestion = normalizeEditableQuestion(editQ, difficulty);
    if (!normalizedQuestion.question) {
      showAlert('warning', 'Question Required', 'Question text cannot be empty.');
      return;
    }

    setQuestions((qs) => qs.map((q, i) => (i === editingIdx ? normalizedQuestion : q)));
    setEditingIdx(null);
    setEditQ({});
  };

  const handleDelete = (idx) => {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
    if (editingIdx === idx) {
      setEditingIdx(null);
      setEditQ({});
    }
  };

  const handleAddQuestion = () => {
    const typeForNewQuestion = quizType === 'mixed' ? 'mcq' : quizType;
    const blankQuestion = createBlankQuestion(typeForNewQuestion, difficulty);
    setQuestions((current) => [...current, blankQuestion]);
    setEditingIdx(questions.length);
    setEditQ(blankQuestion);
  };

  // Save quiz to class
  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      await showAlert('warning', 'Title Required', 'Quiz title is required.');
      return;
    }

    if (questions.length === 0) {
      await showAlert('warning', 'No Questions Available', 'Generate or add at least one question before saving.');
      return;
    }

    setLoading(true);
    try {
      const normalizedQuestions = questions.map((q) => {
        const normalizedQuestion = normalizeEditableQuestion(q, difficulty);
        let type = normalizedQuestion.type;
        if (type === 'true_false') type = 'true_false';
        else if (type === 'identification') type = 'identification';
        else type = 'mcq';

        return { ...normalizedQuestion, type };
      });

      const response = await axios.post(`${API_BASE_URL}/quizzes`, {
        classId,
        title: title.trim(),
        questions: normalizedQuestions,
        createdBy: teacherId,
        dueDate,
        questionTime,
      });

      showAlert('success', 'Quiz Saved', 'Quiz saved successfully.');
      setCreatedQuizzes((current) => [response.data, ...current.filter((quiz) => quiz._id !== response.data._id)]);
      setQuestions([]);
      setEditingIdx(null);
      setEditQ({});
      setTitle('');
      setShowSaveModal(false);
    } catch {
      showAlert('error', 'Save Failed', 'Failed to save quiz.');
    } finally {
      setLoading(false);
    }
  };

  // Delete quiz function
  const handleDeleteQuiz = async (quizId) => {
    const confirmed = await showConfirm('Delete Quiz?', 'This action cannot be undone.');
    if (!confirmed) {
      return;
    }
    
    try {
      await axios.delete(`${API_BASE_URL}/quizzes/${quizId}`);
      // Remove the deleted quiz from the local state
      setCreatedQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz._id !== quizId));
      // Also remove submissions for this quiz
      setSubmissionsByQuiz(prevSubs => {
        const newSubs = { ...prevSubs };
        delete newSubs[quizId];
        return newSubs;
      });
      showAlert('success', 'Quiz Deleted', 'Quiz deleted successfully.');
    } catch {
      showAlert('error', 'Delete Failed', 'Failed to delete quiz. Please try again.');
    }
  };

  const buildQuestionExportRows = () =>
    questions.map((question, index) => {
      const normalizedQuestion = normalizeEditableQuestion(question, difficulty);
      const normalizedType = normalizeQuestionType(normalizedQuestion.type);
      const options = normalizedType === 'mcq'
        ? normalizedQuestion.options
        : normalizedType === 'true_false'
          ? ['True', 'False']
          : [];
      const answer = normalizedQuestion.answer || normalizedQuestion.correctAnswer || '';

      return {
        'Question Number': index + 1,
        Type: QUIZ_TYPE_LABELS[normalizedType] || normalizedType,
        Difficulty: DIFFICULTY_LABELS[normalizedQuestion.difficulty] || normalizedQuestion.difficulty || '',
        Question: normalizedQuestion.question,
        'Choice A': options[0] || '',
        'Choice B': options[1] || '',
        'Choice C': options[2] || '',
        'Choice D': options[3] || '',
        'Correct Answer': answer,
        Explanation: normalizedQuestion.explanation || '',
      };
    });

  const handleExportToExcel = () => {
    if (!questions || questions.length === 0) {
      showAlert('info', 'No Questions Available', 'Please generate or create questions first.');
      return;
    }

    const safeTitle = createSafeFilename(title || topic || 'Quiz');
    const exportTitle = `Quiz Questions: ${title || topic || 'Untitled Quiz'}`;
    const generatedAt = new Date().toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    const rows = [
      [exportTitle],
      [`Generated on: ${generatedAt}`],
      [],
      ['#', 'Type', 'Difficulty', 'Question', 'Choice A', 'Choice B', 'Choice C', 'Choice D', 'Correct Answer', 'Explanation']
    ];

    const questionRows = buildQuestionExportRows();
    questionRows.forEach(q => {
      rows.push([
        q['Question Number'],
        q.Type,
        q.Difficulty,
        q.Question,
        q['Choice A'],
        q['Choice B'],
        q['Choice C'],
        q['Choice D'],
        q['Correct Answer'],
        q.Explanation,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    ];

    worksheet['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 12 }, { wch: 60 },
      { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 },
      { wch: 30 }, { wch: 60 },
    ];
    
    worksheet['!rows'] = [
      { hpt: 30 }, { hpt: 20 }
    ];

    // Title Style
    setWorksheetCellStyle(worksheet, 0, 0, buildExcelStyle({
      bold: true, size: 20, color: EXCEL_THEME.white, fillColor: EXCEL_THEME.primary,
      align: "center", border: buildExcelBorder("medium", EXCEL_THEME.primary)
    }));

    // Subtitle Style
    setWorksheetCellStyle(worksheet, 1, 0, buildExcelStyle({
      size: 12, color: EXCEL_THEME.lightText, fillColor: EXCEL_THEME.secondary,
      align: "center", border: buildExcelBorder("medium", EXCEL_THEME.secondary)
    }));

    // Header Row Style
    for (let c = 0; c < 10; c++) {
      setWorksheetCellStyle(worksheet, 3, c, buildExcelStyle({
        bold: true, size: 12, fillColor: EXCEL_THEME.headerBg, align: "center",
        wrapText: true, border: buildExcelBorder("medium", EXCEL_THEME.headerText)
      }));
    }

    // Data Rows Style
    for (let r = 4; r < rows.length; r++) {
      const isEvenRow = (r - 4) % 2 === 0;
      const rowFill = isEvenRow ? EXCEL_THEME.rowBase : EXCEL_THEME.rowAlt;
      for (let c = 0; c < 10; c++) {
        setWorksheetCellStyle(worksheet, r, c, buildExcelStyle({
          fillColor: rowFill,
          align: c === 0 || c === 1 || c === 2 ? "center" : "left",
          wrapText: true,
          border: buildExcelBorder("thin"),
        }));
      }
    }
    
    worksheet['!autofilter'] = { ref: 'A4:J4' };
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Quiz Questions');
    XLSX.writeFile(workbook, `${safeTitle}_Questions.xlsx`);
  };

  const handleExportToPdf = () => {
    if (!questions || questions.length === 0) {
      showAlert('info', 'No Questions Available', 'Please generate or create questions first.');
      return;
    }

    const printableWindow = window.open('', '_blank', 'width=1000,height=1200');
    if (!printableWindow) {
      showAlert('warning', 'Popup Blocked', 'Please allow popups to export the quiz as PDF.');
      return;
    }

    const exportRows = buildQuestionExportRows();
    const printableHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${title || topic || 'Quiz'} PDF</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 32px;
            color: #0f172a;
            line-height: 1.45;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 28px;
          }
          .meta {
            margin-bottom: 24px;
            color: #334155;
            font-size: 14px;
          }
          .card {
            border: 1px solid #cbd5e1;
            border-radius: 16px;
            padding: 18px 20px;
            margin-bottom: 16px;
            page-break-inside: avoid;
          }
          .badges {
            margin: 8px 0 12px;
            font-size: 12px;
            color: #1d4ed8;
            font-weight: 700;
          }
          .option {
            margin: 6px 0;
          }
          .answer {
            margin-top: 12px;
            font-weight: 700;
          }
          .explanation {
            margin-top: 10px;
            font-size: 13px;
            color: #475569;
          }
        </style>
      </head>
      <body>
        <h1>${title || topic || 'Quiz'}</h1>
        <div class="meta">
          Topic: ${topic || 'N/A'}<br />
          Focus: ${focusDescription || 'General coverage'}<br />
          Total Questions: ${questions.length}<br />
          Difficulty: ${DIFFICULTY_LABELS[difficulty] || difficulty}
        </div>
        ${exportRows.map((row) => `
          <div class="card">
            <div><strong>${row['Question Number']}.</strong> ${row.Question}</div>
            <div class="badges">${row.Type} | ${row.Difficulty}</div>
            ${['Choice A', 'Choice B', 'Choice C', 'Choice D'].filter((key) => row[key]).map((key, optionIndex) => `
              <div class="option">${String.fromCharCode(65 + optionIndex)}. ${row[key]}</div>
            `).join('')}
            <div class="answer">Correct Answer: ${row['Correct Answer']}</div>
            ${row.Explanation ? `<div class="explanation">Explanation: ${row.Explanation}</div>` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    printableWindow.document.open();
    printableWindow.document.write(printableHtml);
    printableWindow.document.close();
    printableWindow.focus();
    window.setTimeout(() => {
      printableWindow.print();
    }, 250);
  };

  // Export quiz to Word document
  const handleExportToWord = () => {
    if (!questions || questions.length === 0) {
      showAlert('info', 'No Questions Available', 'Please generate or create questions first.');
      return;
    }

    // Create HTML content for the Word document
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title || topic || 'Quiz'} - Test Paper</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            margin: 1in; 
            line-height: 1.5;
            font-size: 12pt;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .school-name { 
            font-size: 16pt; 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .als-info {
            font-size: 14pt;
            margin-bottom: 10px;
          }
          .quiz-title { 
            font-size: 14pt; 
            font-weight: bold; 
            margin: 15px 0;
          }
          .student-info { 
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
          }
          .info-line {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 200px;
            margin-left: 10px;
          }
          .question { 
            margin: 20px 0;
            page-break-inside: avoid;
          }
          .question-number { 
            font-weight: bold; 
          }
          .options { 
            margin: 10px 0; 
            margin-left: 20px;
          }
          .option { 
            margin: 5px 0;
          }
          .answer-space {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 300px;
            margin-left: 10px;
          }
          .instructions {
            background-color: #f5f5f5;
            padding: 15px;
            margin: 20px 0;
            border: 1px solid #ccc;
          }
          .score-box {
            float: right;
            border: 2px solid #000;
            padding: 10px;
            margin-bottom: 20px;
          }
          @media print {
            body { margin: 0.5in; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">ALTERNATIVE LEARNING SYSTEM (ALS)</div>
          <div class="als-info">Department of Education</div>
          <div class="quiz-title">${title || topic || 'QUIZ'}</div>
        </div>

        <div class="score-box">
          <strong>Score: _____ / ${questions.length}</strong>
        </div>

        <div class="student-info">
          <div>
            <strong>Name:</strong> <span class="info-line"></span>
          </div>
          <div>
            <strong>Date:</strong> <span class="info-line">${currentDate}</span>
          </div>
        </div>

        <div class="instructions">
          <strong>INSTRUCTIONS:</strong>
          <ul>
            <li>Read each question carefully.</li>
            <li>Choose the best answer for multiple choice questions.</li>
            <li>Write TRUE or FALSE for true/false questions.</li>
            <li>Write your answer clearly for identification questions.</li>
            <li>Use black or blue pen only.</li>
            <li>No erasures allowed.</li>
          </ul>
        </div>
    `;

    // Add questions
    questions.forEach((q, index) => {
      htmlContent += `<div class="question">`;
      htmlContent += `<span class="question-number">${index + 1}.</span> ${q.question}`;
      
      const normalizedType = normalizeQuestionType(q.type);
      if (normalizedType === 'mcq' && q.options && q.options.length > 0) {
        htmlContent += `<div class="options">`;
        q.options.forEach((option, optIndex) => {
          const letter = String.fromCharCode(65 + optIndex); // A, B, C, D
          htmlContent += `<div class="option">${letter}. ${option}</div>`;
        });
        htmlContent += `</div>`;
        htmlContent += `<div><strong>Answer:</strong> <span class="answer-space"></span></div>`;
      } else if (normalizedType === 'true_false') {
        htmlContent += `<div class="options">`;
        htmlContent += `<div class="option">A. TRUE</div>`;
        htmlContent += `<div class="option">B. FALSE</div>`;
        htmlContent += `</div>`;
        htmlContent += `<div><strong>Answer:</strong> <span class="answer-space"></span></div>`;
      } else {
        // Identification type
        htmlContent += `<div style="margin-top: 15px;"><strong>Answer:</strong> <span class="answer-space"></span></div>`;
      }
      
      htmlContent += `</div>`;
    });

    htmlContent += `
        <div style="margin-top: 50px; text-align: center; font-style: italic;">
          --- END OF TEST ---
        </div>
      </body>
      </html>
    `;

    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${createSafeFilename(title || topic || 'Quiz')}_TestPaper_${currentDate.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Export quiz analytics to Excel (Proper Excel file)
  const handleExportAnalyticsToExcel = () => {
    const analytics = calculateQuizAnalytics();
    if (analytics.length === 0) {
      showAlert('info', 'No Quiz Data', 'Students need to submit quizzes first.');
      return;
    }

    // Create proper Excel XML format
    let excelXML = `<?xml version="1.0"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
              xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
              xmlns:html="http://www.w3.org/TR/REC-html40">
    <Styles>
      <Style ss:ID="HeaderStyle">
        <Font ss:Bold="1"/>
        <Interior ss:Color="#4CAF50" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="NumberStyle">
        <NumberFormat ss:Format="0"/>
      </Style>
      <Style ss:ID="PercentStyle">
        <NumberFormat ss:Format="0.0%"/>
      </Style>
    </Styles>
    <Worksheet ss:Name="Quiz Analytics">
      <Table>
        <Row ss:StyleID="HeaderStyle">
          <Cell><Data ss:Type="String">Quiz Name</Data></Cell>
          <Cell><Data ss:Type="String">Student Name</Data></Cell>
          <Cell><Data ss:Type="String">Student Email</Data></Cell>
          <Cell><Data ss:Type="String">Score</Data></Cell>
          <Cell><Data ss:Type="String">Total Questions</Data></Cell>
          <Cell><Data ss:Type="String">Percentage</Data></Cell>
          <Cell><Data ss:Type="String">Submission Date</Data></Cell>
          <Cell><Data ss:Type="String">Time Taken</Data></Cell>
        </Row>`;
    
    // Add data rows for each quiz
    analytics.forEach(({ quiz }) => {
      const submissions = submissionsByQuiz[quiz._id] || [];
      
      submissions.forEach(submission => {
        const studentName = submission.studentId?.name || submission.student?.name || submission.studentName || 'Unknown Student';
        const studentEmail = submission.studentId?.email || submission.student?.email || submission.studentEmail || 'N/A';
        const score = submission.score || 0;
        const totalQuestions = quiz.questions?.length || 0;
        const percentage = totalQuestions > 0 ? (score / totalQuestions) : 0;
        const submissionDate = submission.createdAt ? 
          new Date(submission.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : 'N/A';
        const timeTaken = submission.timeTaken ? 
          `${Math.floor(submission.timeTaken / 60)}:${String(submission.timeTaken % 60).padStart(2, '0')}` : 'N/A';
        
        // Escape XML characters
        const escapeXML = (text) => {
          return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        };
        
        excelXML += `
        <Row>
          <Cell><Data ss:Type="String">${escapeXML(quiz.title)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXML(studentName)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXML(studentEmail)}</Data></Cell>
          <Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${score}</Data></Cell>
          <Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${totalQuestions}</Data></Cell>
          <Cell ss:StyleID="PercentStyle"><Data ss:Type="Number">${percentage}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXML(submissionDate)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXML(timeTaken)}</Data></Cell>
        </Row>`;
      });
    });

    excelXML += `
      </Table>
    </Worksheet>
    </Workbook>`;

    // Create and download the Excel file
    const blob = new Blob([excelXML], { 
      type: 'application/vnd.ms-excel' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    }).replace(':', '');
    link.download = `Quiz_Analytics_${currentDate}_${currentTime}.xls`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showAlert('success', 'Export Complete', 'Quiz analytics exported to Excel file successfully.');
  };

  // Export detailed analytics with question breakdown (Proper Excel file)
  const handleExportDetailedAnalytics = () => {
    const analytics = calculateQuizAnalytics();
    if (analytics.length === 0) {
      showAlert('info', 'No Quiz Data', 'No quiz data available for export.');
      return;
    }

    // Create proper Excel XML format
    let excelXML = `<?xml version="1.0"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
              xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
              xmlns:html="http://www.w3.org/TR/REC-html40">
    <Styles>
      <Style ss:ID="HeaderStyle">
        <Font ss:Bold="1"/>
        <Interior ss:Color="#2196F3" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="CorrectStyle">
        <Interior ss:Color="#C8E6C9" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="IncorrectStyle">
        <Interior ss:Color="#FFCDD2" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="NumberStyle">
        <NumberFormat ss:Format="0"/>
      </Style>
    </Styles>
    <Worksheet ss:Name="Detailed Analytics">
      <Table>
        <Row ss:StyleID="HeaderStyle">
          <Cell><Data ss:Type="String">Quiz Name</Data></Cell>
          <Cell><Data ss:Type="String">Student Name</Data></Cell>
          <Cell><Data ss:Type="String">Student Email</Data></Cell>
          <Cell><Data ss:Type="String">Question #</Data></Cell>
          <Cell><Data ss:Type="String">Question Text</Data></Cell>
          <Cell><Data ss:Type="String">Student Answer</Data></Cell>
          <Cell><Data ss:Type="String">Correct Answer</Data></Cell>
          <Cell><Data ss:Type="String">Is Correct</Data></Cell>
          <Cell><Data ss:Type="String">Score</Data></Cell>
          <Cell><Data ss:Type="String">Submission Date</Data></Cell>
        </Row>`;
    
    analytics.forEach(({ quiz }) => {
      const submissions = submissionsByQuiz[quiz._id] || [];
      
      submissions.forEach(submission => {
        const studentName = submission.studentId?.name || submission.student?.name || submission.studentName || 'Unknown Student';
        const studentEmail = submission.studentId?.email || submission.student?.email || submission.studentEmail || 'N/A';
        const submissionDate = submission.createdAt ? 
          new Date(submission.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : 'N/A';
        
        quiz.questions?.forEach((question, qIndex) => {
          const studentAnswer = submission.answers?.find(a => a.questionIndex === qIndex);
          const studentResponse = studentAnswer?.answer || 'No Answer';
          const correctAnswer = question.answer || 'N/A';
          const isCorrect = studentAnswer ? 
            (String(question.answer).trim().toLowerCase() === String(studentAnswer.answer).trim().toLowerCase()) : false;
          const questionScore = isCorrect ? 1 : 0;
          const rowStyle = isCorrect ? 'CorrectStyle' : 'IncorrectStyle';
          
          // Escape XML characters
          const escapeXML = (text) => {
            return String(text)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
          };
          
          excelXML += `
          <Row ss:StyleID="${rowStyle}">
            <Cell><Data ss:Type="String">${escapeXML(quiz.title)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXML(studentName)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXML(studentEmail)}</Data></Cell>
            <Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${qIndex + 1}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXML(question.question)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXML(studentResponse)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXML(correctAnswer)}</Data></Cell>
            <Cell><Data ss:Type="String">${isCorrect ? 'YES' : 'NO'}</Data></Cell>
            <Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${questionScore}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXML(submissionDate)}</Data></Cell>
          </Row>`;
        });
      });
    });

    excelXML += `
      </Table>
    </Worksheet>
    </Workbook>`;

    // Create and download the Excel file
    const blob = new Blob([excelXML], { 
      type: 'application/vnd.ms-excel' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    }).replace(':', '');
    link.download = `Quiz_Detailed_Analytics_${currentDate}_${currentTime}.xls`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showAlert('success', 'Export Complete', 'Detailed quiz analytics exported to Excel file successfully.');
  };

  // Calculate quiz analytics
  const calculateQuizAnalytics = () => {
    const analytics = [];
    
    createdQuizzes.forEach(quiz => {
      const submissions = submissionsByQuiz[quiz._id] || [];
      if (submissions.length === 0) return;
      
      const questionAnalytics = [];
      
      // Analyze each question
      quiz.questions?.forEach((question, qIndex) => {
        let correctCount = 0;
        let incorrectCount = 0;
        const incorrectAnswers = [];
        const studentResponses = []; // Track individual student responses
        
        submissions.forEach(submission => {
          const studentAnswer = submission.answers?.find(a => a.questionIndex === qIndex);
          const studentName = submission.studentId?.name || submission.student?.name || submission.studentName || 'Unknown Student';
          const studentEmail = submission.studentId?.email || submission.student?.email || submission.studentEmail || 'N/A';
          
          if (studentAnswer && studentAnswer.answer !== undefined) {
            const correct = String(question.answer).trim().toLowerCase();
            const submitted = String(studentAnswer.answer).trim().toLowerCase();
            const isCorrect = submitted === correct;
            
            if (isCorrect) {
              correctCount++;
            } else {
              incorrectCount++;
              incorrectAnswers.push(studentAnswer.answer);
            }
            
            // Track individual student response
            studentResponses.push({
              studentName,
              studentEmail,
              answer: studentAnswer.answer,
              isCorrect,
              submissionId: submission._id
            });
          } else {
            incorrectCount++; // Count no answer as incorrect
            studentResponses.push({
              studentName,
              studentEmail,
              answer: 'No Answer',
              isCorrect: false,
              submissionId: submission._id
            });
          }
        });
        
        const totalAttempts = correctCount + incorrectCount;
        const difficultyPercentage = totalAttempts > 0 ? Math.round((incorrectCount / totalAttempts) * 100) : 0;
        const successPercentage = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
        
        // Find most common wrong answers
        const wrongAnswerCounts = {};
        incorrectAnswers.forEach(answer => {
          const key = String(answer).trim();
          wrongAnswerCounts[key] = (wrongAnswerCounts[key] || 0) + 1;
        });
        
        const commonWrongAnswers = Object.entries(wrongAnswerCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([answer, count]) => ({ answer, count }));
        
        // Separate correct and incorrect students
        const correctStudents = studentResponses.filter(r => r.isCorrect);
        const incorrectStudents = studentResponses.filter(r => !r.isCorrect);
        
        questionAnalytics.push({
          questionIndex: qIndex,
          question: question.question,
          correctAnswer: question.answer,
          totalAttempts,
          correctCount,
          incorrectCount,
          difficultyPercentage,
          successPercentage,
          commonWrongAnswers,
          correctStudents,
          incorrectStudents,
          allStudentResponses: studentResponses
        });
      });
      
      analytics.push({
        quiz,
        totalSubmissions: submissions.length,
        questionAnalytics
      });
    });
    
    return analytics;
  };

  // Wrap the whole return in a single centered div
  return (
    <div className="flex flex-col items-center justify-start min-h-full bg-white py-4 sm:py-6 lg:py-10 px-2 sm:px-4">{/* Improved responsive padding */}
      <div className="w-full max-w-[95vw] sm:max-w-[90vw] xl:max-w-[1600px] p-2 sm:p-6 lg:p-10 bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-xl sm:rounded-3xl shadow-lg border-l-4 border-blue-400 overflow-hidden max-h-[85vh] sm:max-h-[88vh] lg:max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 hover:scrollbar-thumb-blue-600 scrollbar-track-blue-100 relative scroll-smooth">
        <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-4 sm:px-8 py-4 sm:py-6 flex flex-col gap-4 border-b-2 sm:border-b-4 border-blue-200 shadow-md sticky top-0 z-10">{/* Made header sticky */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-900 drop-shadow tracking-wide flex items-center gap-3 justify-center">
            <svg className="w-10 h-10 text-blue-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v1.5m9 0v1.5m0-1.5h-9m9 0a2.25 2.25 0 012.25 2.25v8.25A2.25 2.25 0 0116.5 20.25h-9A2.25 2.25 0 015.25 18V9a2.25 2.25 0 012.25-2.25h9z" /></svg>
            Quiz Generator
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              className="w-full sm:w-auto rounded-xl border-2 border-blue-300 bg-white px-4 py-3 text-sm font-semibold text-blue-900 shadow-sm transition hover:bg-blue-50"
              onClick={() => setShowAnalyticsModal(true)}
            >
              Quiz Analytics
            </button>
            <button
              className="w-full sm:w-auto rounded-xl border-2 border-indigo-300 bg-white px-4 py-3 text-sm font-semibold text-indigo-900 shadow-sm transition hover:bg-indigo-50"
              onClick={() => setShowSubModal(true)}
            >
              View Submissions
            </button>
          </div>
        </div>
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24 min-h-full">
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 mb-6">
            <div className="bg-white rounded-3xl border border-blue-200 shadow-lg p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-5">
                <div>
                  <h3 className="text-xl font-bold text-blue-900">Quiz Setup</h3>
                  <p className="text-sm text-gray-600">Topic is required. Focus details and reference material help the generator stay accurate and relevant.</p>
                </div>
                <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Exact-count generation
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-blue-900">Topic / Subject</span>
                  <input
                    className="border-2 border-blue-200 bg-white text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Example: Computer Fundamentals"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-blue-900">Number of Questions</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="border-2 border-blue-200 bg-white text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={count}
                    onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                    required
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-blue-900">Difficulty Level</span>
                  <select
                    className="border-2 border-blue-200 bg-white text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-blue-900">Type of Quiz</span>
                  <select
                    className="border-2 border-blue-200 bg-white text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={quizType}
                    onChange={(e) => setQuizType(e.target.value)}
                  >
                    <option value="mixed">Mixed Type</option>
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="identification">Identification</option>
                  </select>
                </label>

                <label className="md:col-span-2 flex flex-col gap-2">
                  <span className="text-sm font-semibold text-blue-900">Description / Focus</span>
                  <textarea
                    className="border-2 border-blue-200 bg-white text-gray-900 rounded-2xl px-4 py-3 min-h-[110px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional: add the exact competencies, subtopics, or lesson focus you want the quiz to cover."
                    value={focusDescription}
                    onChange={(e) => setFocusDescription(e.target.value)}
                  />
                </label>
              </div>

              {quizType === 'mixed' && (
                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h4 className="text-sm font-bold text-blue-900">Mixed Type Distribution</h4>
                    <span className="text-sm text-blue-700">Current total: {mcqCount + trueFalseCount + identificationCount} / {count}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center justify-between gap-3 rounded-xl bg-white border border-blue-200 px-4 py-3">
                      <span className="text-sm font-medium text-blue-900">Multiple Choice</span>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className="w-20 border border-blue-200 rounded-lg px-2 py-1 text-gray-900 focus:ring-2 focus:ring-blue-500"
                        value={mcqCount}
                        onChange={(e) => setMcqCount(Math.max(0, Number(e.target.value) || 0))}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-xl bg-white border border-blue-200 px-4 py-3">
                      <span className="text-sm font-medium text-blue-900">True/False</span>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className="w-20 border border-blue-200 rounded-lg px-2 py-1 text-gray-900 focus:ring-2 focus:ring-blue-500"
                        value={trueFalseCount}
                        onChange={(e) => setTrueFalseCount(Math.max(0, Number(e.target.value) || 0))}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-xl bg-white border border-blue-200 px-4 py-3">
                      <span className="text-sm font-medium text-blue-900">Identification</span>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className="w-20 border border-blue-200 rounded-lg px-2 py-1 text-gray-900 focus:ring-2 focus:ring-blue-500"
                        value={identificationCount}
                        onChange={(e) => setIdentificationCount(Math.max(0, Number(e.target.value) || 0))}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-blue-200 shadow-lg p-5 sm:p-6">
              <div className="mb-5">
                <h3 className="text-xl font-bold text-blue-900">Reference Material</h3>
                <p className="text-sm text-gray-600 mt-1">Optional, but strongly recommended when you want questions based on a module, handout, reviewer, or extracted file text.</p>
              </div>

              <div className="flex flex-col gap-3 mb-4">
                <label className="inline-flex items-center justify-center gap-2 cursor-pointer bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 px-4 py-3 rounded-2xl shadow-sm transition group">
                  <FaUpload className="text-blue-600 group-hover:text-blue-700 transition" />
                  <input type="file" accept=".txt,.pdf,.jpg,.jpeg,.png,.docx,.doc,.pptx,.ppt" className="hidden" onChange={handleFileChange} />
                  <span className="font-medium text-blue-800">Upload source file</span>
                </label>

                <label className="flex items-start gap-3">
                  <FaPaste className="mt-3 text-blue-600 shrink-0" />
                  <textarea
                    className="border-2 border-blue-200 bg-white text-gray-900 rounded-2xl p-3 w-full min-h-[210px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 shadow-sm"
                    placeholder="Paste lesson notes, reviewer content, or source text here..."
                    value={moduleText}
                    onChange={(e) => setModuleText(e.target.value)}
                  />
                </label>
              </div>

              <div className="space-y-3 rounded-2xl border border-blue-200 bg-slate-50 p-4">
                <h4 className="text-sm font-bold text-slate-900">Optional Generation Controls</h4>
                <label className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 border border-slate-200">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Shuffle generated questions</div>
                    <div className="text-xs text-slate-600">Mix the final order after generation.</div>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-blue-600"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 border border-slate-200">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Include answer explanations</div>
                    <div className="text-xs text-slate-600">Show a short explanation under each generated answer.</div>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-blue-600"
                    checked={includeExplanations}
                    onChange={(e) => setIncludeExplanations(e.target.checked)}
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition mb-4 w-full text-lg disabled:opacity-60 tracking-wider focus:ring-4 focus:ring-blue-400"
            onClick={questions.length > 0 ? handleRegenerate : handleGenerate}
            disabled={loading || !topic.trim()}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-6 h-6 animate-spin text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
                Generating Quiz...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                {questions.length > 0 ? 'Regenerate Quiz' : 'Generate Quiz'}
              </span>
            )}
          </button>

          {loading && (
            <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900 shadow-sm">
              Creating exactly {count} {DIFFICULTY_LABELS[difficulty]?.toLowerCase() || difficulty} {count === 1 ? 'question' : 'questions'} for <span className="font-bold">{topic.trim()}</span>{focusDescription.trim() ? ` with focus on ${focusDescription.trim()}.` : '.'}
            </div>
          )}

          {questions.length > 0 && (
            <>
              <div className="border-b-2 border-blue-200 mb-6"></div>

              <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-2xl font-bold text-blue-900">Generated Quiz</h3>
                  <p className="text-sm text-gray-600 mt-1">Review the questions below, edit anything manually, then export or save the final version to class.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">{questions.length} Questions</span>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-800">{QUIZ_TYPE_LABELS[quizType] || QUIZ_TYPE_LABELS[normalizeQuestionType(quizType)]}</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">{DIFFICULTY_LABELS[difficulty] || difficulty}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold shadow transition"
                  onClick={handleRegenerate}
                  disabled={loading}
                >
                  Regenerate Quiz
                </button>
                <button
                  className="bg-white hover:bg-blue-50 text-blue-900 border border-blue-200 px-4 py-3 rounded-xl font-semibold shadow-sm transition"
                  onClick={handleExportToPdf}
                  disabled={loading}
                >
                  Download PDF
                </button>
                <button
                  className="bg-white hover:bg-blue-50 text-blue-900 border border-blue-200 px-4 py-3 rounded-xl font-semibold shadow-sm transition"
                  onClick={handleExportToExcel}
                  disabled={loading}
                >
                  Download Excel
                </button>
                <button
                  className="bg-white hover:bg-blue-50 text-blue-900 border border-blue-200 px-4 py-3 rounded-xl font-semibold shadow-sm transition flex items-center gap-2"
                  onClick={handleExportToWord}
                  disabled={loading}
                >
                  <FaFileWord className="w-4 h-4" />
                  Export Test Paper
                </button>
                <button
                  className="bg-white hover:bg-blue-50 text-blue-900 border border-blue-200 px-4 py-3 rounded-xl font-semibold shadow-sm transition flex items-center gap-2"
                  onClick={handleAddQuestion}
                >
                  <FaPlus className="w-4 h-4" />
                  Add Manual Question
                </button>
              </div>

              <div className="flex flex-col gap-4 mb-8">
                {questions.map((question, idx) => {
                  const normalizedQuestion = normalizeEditableQuestion(question, difficulty);
                  const resolvedType = normalizeQuestionType(normalizedQuestion.type);
                  const correctAnswer = normalizedQuestion.answer || normalizedQuestion.correctAnswer || '';
                  const optionList = resolvedType === 'mcq'
                    ? normalizedQuestion.options
                    : resolvedType === 'true_false'
                      ? ['True', 'False']
                      : [];

                  return (
                    <div key={idx} className="border border-blue-200 rounded-3xl bg-white p-5 shadow-md flex flex-col gap-4">
                      {editingIdx === idx ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">Question {idx + 1}</span>
                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-800">{QUIZ_TYPE_LABELS[resolvedType] || normalizedQuestion.displayType || resolvedType}</span>
                          </div>

                          <textarea
                            className="border-2 border-blue-200 bg-white text-gray-900 rounded-2xl p-3 w-full min-h-[92px] text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editQ.question || ''}
                            onChange={(e) => handleEditChange('question', e.target.value)}
                            placeholder="Question text"
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex flex-col gap-2">
                              <span className="text-sm font-semibold text-blue-900">Difficulty</span>
                              <select
                                className="border border-blue-200 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                                value={editQ.difficulty || difficulty}
                                onChange={(e) => handleEditChange('difficulty', e.target.value)}
                              >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </label>
                            <label className="flex flex-col gap-2">
                              <span className="text-sm font-semibold text-blue-900">Explanation</span>
                              <textarea
                                className="border border-blue-200 rounded-xl px-3 py-2 text-gray-900 min-h-[90px] focus:ring-2 focus:ring-blue-500"
                                value={editQ.explanation || ''}
                                onChange={(e) => handleEditChange('explanation', e.target.value)}
                                placeholder="Short explanation"
                              />
                            </label>
                          </div>

                          {resolvedType === 'mcq' && (
                            <>
                              <textarea
                                className="border-2 border-blue-200 bg-white text-gray-900 rounded-2xl p-3 w-full min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={Array.isArray(editQ.options) ? editQ.options.join('\n') : ''}
                                onChange={(e) => handleEditChange('options', e.target.value.split('\n'))}
                                placeholder="Choices, one per line"
                              />
                              <label className="flex flex-col gap-2">
                                <span className="text-sm font-semibold text-blue-900">Correct Answer</span>
                                <select
                                  className="border border-blue-200 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                                  value={editQ.answer || (editQ.options && editQ.options[0]) || ''}
                                  onChange={(e) => handleEditChange('answer', e.target.value)}
                                >
                                  {(editQ.options || []).filter(Boolean).map((option, optionIndex) => (
                                    <option key={optionIndex} value={option}>{option}</option>
                                  ))}
                                </select>
                              </label>
                            </>
                          )}

                          {resolvedType === 'true_false' && (
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-3">
                                <input type="radio" name={`editQ${idx}`} value="True" checked={editQ.answer === 'True'} onChange={() => handleEditChange('answer', 'True')} />
                                True
                              </label>
                              <label className="flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-3">
                                <input type="radio" name={`editQ${idx}`} value="False" checked={editQ.answer === 'False'} onChange={() => handleEditChange('answer', 'False')} />
                                False
                              </label>
                            </div>
                          )}

                          {resolvedType === 'identification' && (
                            <input
                              className="border-2 border-blue-200 bg-white text-gray-900 rounded-2xl p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={editQ.answer || ''}
                              onChange={(e) => handleEditChange('answer', e.target.value)}
                              placeholder="Correct answer"
                            />
                          )}

                          <div className="flex gap-2 mt-2">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow" onClick={handleSaveEdit}><FaSave /></button>
                            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl shadow" onClick={() => { setEditingIdx(null); setEditQ({}); }}><FaTimes /></button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">Question {idx + 1}</span>
                              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-800">{QUIZ_TYPE_LABELS[resolvedType] || normalizedQuestion.displayType || resolvedType}</span>
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">{DIFFICULTY_LABELS[normalizedQuestion.difficulty] || normalizedQuestion.difficulty || difficulty}</span>
                            </div>
                            <div className="flex gap-2">
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl shadow" onClick={() => handleEdit(idx)}><FaEdit /></button>
                              <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl shadow" onClick={() => handleDelete(idx)}><FaTrash /></button>
                            </div>
                          </div>

                          <div className="text-lg font-semibold text-slate-900">{normalizedQuestion.question}</div>

                          {optionList.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {optionList.map((option, optionIndex) => (
                                <div key={optionIndex} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-slate-800">
                                  <span className="mr-2 font-bold text-blue-700">{String.fromCharCode(65 + optionIndex)}.</span>
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="rounded-2xl border border-blue-200 bg-white px-4 py-3">
                            <span className="text-sm font-semibold text-blue-900">Correct Answer:</span>
                            <div className="mt-1 text-base font-bold text-slate-900">{correctAnswer}</div>
                          </div>

                          {includeExplanations && normalizedQuestion.explanation && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                              <span className="font-semibold text-slate-900">Explanation:</span> {normalizedQuestion.explanation}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        {questions.length > 0 && (
          <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
            <button
              className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-8 py-3 rounded-2xl font-bold shadow-2xl hover:from-blue-800 hover:to-indigo-900 transition text-lg border-4 border-blue-400 hover:border-indigo-500 focus:ring-4 focus:ring-blue-300 focus:outline-none group overflow-hidden"
              onClick={handleExportToWord}
              disabled={loading}
              title="Export as Word Test Paper"
            >
              <span className="absolute left-0 top-0 w-full h-full bg-blue-400 opacity-0 group-hover:opacity-10 transition-all rounded-2xl"></span>
              <span className="flex items-center gap-2">
                <FaFileWord className="w-5 h-5 text-white drop-shadow-lg" />
                Export Test Paper
              </span>
            </button>
            <button
              className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white px-10 py-4 rounded-3xl font-extrabold shadow-2xl hover:from-blue-700 hover:to-indigo-800 transition text-xl border-4 border-blue-400 hover:border-indigo-500 focus:ring-4 focus:ring-blue-300 focus:outline-none group overflow-hidden"
              onClick={() => setShowSaveModal(true)}
              disabled={loading}
            >
              <span className="absolute left-0 top-0 w-full h-full bg-blue-400 opacity-0 group-hover:opacity-10 transition-all rounded-3xl"></span>
              <span className="flex items-center gap-2">
                <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Save Quiz to Class
              </span>
            </button>
          </div>
        )}
        {showSaveModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowSaveModal(false)}
          >
            <div
              className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-8 shadow-2xl w-full max-w-md border-4 border-indigo-500 animate-fadeIn relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-indigo-200 hover:text-white text-2xl font-bold focus:outline-none"
                onClick={() => setShowSaveModal(false)}
                aria-label="Close save quiz modal"
              >
                ×
              </button>
              <h2 className="text-2xl font-extrabold text-white mb-4">Save Quiz</h2>
              <input
                className="border-2 border-indigo-700 bg-[#23263a] text-indigo-100 rounded-lg p-3 w-full mb-4 text-lg focus:ring-2 focus:ring-indigo-400"
                placeholder="Quiz Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <label className="block text-indigo-200 font-semibold mb-2">Due Date</label>
              <input
                type="datetime-local"
                className="border-2 border-indigo-700 bg-[#23263a] text-indigo-100 rounded-lg p-2 w-full mb-4 focus:ring-2 focus:ring-green-400"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
              <label className="block text-indigo-200 font-semibold mb-2">Time Limit per Question (seconds)</label>
              <input
                type="number"
                min={1}
                max={600}
                className="border-2 border-indigo-700 bg-[#23263a] text-indigo-100 rounded-lg p-2 w-full mb-4 focus:ring-2 focus:ring-green-400"
                value={questionTime}
                onChange={e => {
                  const val = Number(e.target.value);
                  if (val > 0) setQuestionTime(val);
                }}
              />
              <div className="flex gap-4 justify-end">
                <button
                  className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded shadow"
                  onClick={() => setShowSaveModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-gradient-to-r from-green-700 to-green-800 text-white px-6 py-2 rounded-xl font-bold shadow hover:from-green-800 hover:to-green-900 transition disabled:opacity-60"
                  onClick={handleSaveQuiz}
                  disabled={loading || !title.trim() || questions.length === 0}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Created Quizzes and Student Submissions Section */}
          <div className="mt-6 sm:mt-8 mb-12 sm:mb-16">{/* Enhanced responsive margins */}
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-blue-900">Your Quizzes</h2>
            {subLoading ? (
              <div className="text-blue-700 p-4 bg-blue-100 rounded-lg animate-pulse">Loading quizzes and submissions...</div>
            ) : createdQuizzes.length === 0 ? (
              <div className="bg-white rounded-lg p-6 sm:p-8 shadow-lg border border-blue-200">
                <p className="text-gray-700 text-center">No quizzes created yet. Generate a quiz from the topic and save it to class when you are ready.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">{/* Improved spacing using space-y */}
                {createdQuizzes.map(quiz => (
                  <div key={quiz._id} className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div className="flex-1 min-w-0 space-y-2">{/* Added space-y for better vertical spacing */}
                        <div className="font-bold text-lg sm:text-xl text-blue-900 break-words leading-tight">{quiz.title}</div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="text-blue-700 text-sm bg-blue-100 px-3 py-1 rounded-full inline-flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            Due: {quiz.dueDate ? new Date(quiz.dueDate).toLocaleString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric', 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            }) : 'N/A'}
                          </div>
                          <div className="text-blue-700 text-sm bg-indigo-100 px-3 py-1 rounded-full inline-flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            {quiz.questions?.length || 0} Questions
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 sm:px-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105"
                        title="Delete Quiz"
                      >
                        <FaTrash className="text-xs" />
                        <span className="sm:hidden">Delete Quiz</span>{/* Show full text on mobile */}
                        <span className="hidden sm:inline">Delete</span>{/* Show short text on desktop */}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {subError && <div className="text-red-400 mt-2">{subError}</div>}
          </div>

        {/* Submissions Modal - all quizzes */}
        {showSubModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowSubModal(false)}
          >
            <div
              className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-4xl border-4 border-blue-400 animate-fadeIn relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold focus:outline-none"
                onClick={() => setShowSubModal(false)}
                aria-label="Close submissions modal"
              >
                ×
              </button>
              <h2 className="text-2xl font-extrabold text-blue-900 mb-4">All Student Submissions</h2>
              <div className="overflow-x-auto max-h-[70vh]">
                {createdQuizzes.length === 0 ? (
                  <div className="text-gray-700">No quizzes created yet.</div>
                ) : (
                  createdQuizzes.map(quiz => (
                    <div key={quiz._id} className="mb-8">
                      <div className="font-bold text-lg text-blue-900 mb-2">{quiz.title}</div>
                      <table className="min-w-full text-gray-900 text-sm border border-blue-300 rounded-lg mb-2">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <th className="px-3 py-2 border-b border-blue-400">Student Name</th>
                            <th className="px-3 py-2 border-b border-blue-400">Student Email</th>
                            <th className="px-3 py-2 border-b border-blue-400">Score</th>
                            <th className="px-3 py-2 border-b border-blue-400">Submitted At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(submissionsByQuiz[quiz._id] || []).length === 0 ? (
                            <tr><td colSpan="4" className="text-gray-600 text-center py-3">No submissions yet.</td></tr>
                          ) : (
                            submissionsByQuiz[quiz._id].map((sub, i) => (
                              <tr key={sub._id || i} className="border-b border-blue-200 hover:bg-blue-50 transition-colors">
                                <td className="px-3 py-2">{sub.studentId?.name || sub.student?.name || sub.studentName || 'N/A'}</td>
                                <td className="px-3 py-2">{sub.studentId?.email || sub.student?.email || sub.studentEmail || 'N/A'}</td>
                                <td className="px-3 py-2">{typeof sub.score === 'number' ? sub.score : 'N/A'}</td>
                                <td className="px-3 py-2">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : (sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'N/A')}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalyticsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowAnalyticsModal(false)}
          >
            <div
              className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-6xl border-4 border-blue-400 animate-fadeIn relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold focus:outline-none"
                onClick={() => setShowAnalyticsModal(false)}
                aria-label="Close analytics modal"
              >
                ×
              </button>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-blue-900 flex items-center gap-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  Quiz Analytics Dashboard
                </h2>
                
                {/* Export Buttons */}
                <div className="flex gap-3">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition flex items-center gap-2 text-sm"
                    onClick={handleExportAnalyticsToExcel}
                    title="Export student scores to Excel"
                  >
                    <FaDownload className="w-4 h-4" />
                    Export Scores
                  </button>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition flex items-center gap-2 text-sm"
                    onClick={handleExportDetailedAnalytics}
                    title="Export detailed question-by-question analysis"
                  >
                    <FaDownload className="w-4 h-4" />
                    Export Details
                  </button>
                </div>
              </div>
              <div className="space-y-8">
                {(() => {
                  const analytics = calculateQuizAnalytics();
                  if (analytics.length === 0) {
                    return (
                      <div className="text-gray-700 text-center py-8">
                        No quiz data available for analytics. Students need to submit quizzes first.
                      </div>
                    );
                  }
                  return analytics.map(({ quiz, totalSubmissions, questionAnalytics }) => (
                    <div key={quiz._id} className="bg-blue-50 rounded-xl p-6 border border-blue-300">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-blue-900">{quiz.title}</h3>
                        <span className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-sm">
                          {totalSubmissions} submissions
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Overall Stats */}
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <h4 className="text-lg font-semibold text-blue-900 mb-3">Overall Performance</h4>
                          <div className="space-y-2">
                            {(() => {
                              const avgDifficulty = questionAnalytics.reduce((sum, q) => sum + q.difficultyPercentage, 0) / questionAnalytics.length;
                              const avgSuccess = questionAnalytics.reduce((sum, q) => sum + q.successPercentage, 0) / questionAnalytics.length;
                              return (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-700">Average Success Rate:</span>
                                    <span className="text-green-600 font-bold">{Math.round(avgSuccess)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-700">Average Difficulty:</span>
                                    <span className="text-orange-600 font-bold">{Math.round(avgDifficulty)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-700">Total Questions:</span>
                                    <span className="text-blue-900 font-bold">{questionAnalytics.length}</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Difficult Questions */}
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <h4 className="text-lg font-semibold text-blue-900 mb-3">Most Difficult Questions</h4>
                          <div className="space-y-3">
                            {questionAnalytics
                              .sort((a, b) => b.difficultyPercentage - a.difficultyPercentage)
                              .slice(0, 3)
                              .map((q) => (
                                <div key={q.questionIndex} className="border-l-4 border-orange-500 pl-3">
                                  <div className="text-sm text-gray-900">Question {q.questionIndex + 1}</div>
                                  <div className="text-orange-600 font-bold">{q.difficultyPercentage}% incorrect</div>
                                  <div className="text-xs text-gray-700 truncate">{q.question}</div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      {/* Detailed Question Analysis */}
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-blue-900 mb-4">Question-by-Question Analysis</h4>
                        <div className="space-y-4">
                          {questionAnalytics.map(q => {
                            const questionKey = `${quiz._id}-${q.questionIndex}`;
                            const isExpanded = expandedQuestions[questionKey];
                            
                            return (
                              <div key={q.questionIndex} className="bg-white rounded-lg p-4 border border-blue-200">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900">Q{q.questionIndex + 1}: {q.question}</div>
                                    <div className="text-sm text-gray-700 mt-1">Correct Answer: {String(q.correctAnswer)}</div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className={`text-lg font-bold ${q.difficultyPercentage > 50 ? 'text-orange-600' : q.difficultyPercentage > 25 ? 'text-amber-600' : 'text-green-600'}`}>
                                      {q.successPercentage}% correct
                                    </div>
                                    <div className="text-sm text-gray-600">{q.totalAttempts} attempts</div>
                                  </div>
                                </div>
                                
                                {/* Progress bar */}
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${q.successPercentage}%` }}
                                  ></div>
                                </div>
                                
                                {/* Common wrong answers */}
                                {q.commonWrongAnswers.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-sm font-semibold text-gray-900 mb-2">Common Wrong Answers:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {q.commonWrongAnswers.map((wrong, idx) => (
                                        <span key={idx} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs border border-orange-300">
                                          "{wrong.answer}" ({wrong.count}x)
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Toggle button for student details */}
                                <div className="mt-4">
                                  <button
                                    onClick={() => setExpandedQuestions(prev => ({
                                      ...prev,
                                      [questionKey]: !prev[questionKey]
                                    }))}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                  >
                                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                                    </svg>
                                    {isExpanded ? 'Hide' : 'Show'} Student Responses ({q.allStudentResponses.length})
                                  </button>
                                </div>
                                
                                {/* Expandable student responses */}
                                {isExpanded && (
                                  <div className="mt-4 space-y-4">
                                    {/* Correct answers section */}
                                    {q.correctStudents.length > 0 && (
                                      <div className="bg-green-50 rounded-lg p-4 border border-green-300">
                                        <h5 className="text-green-800 font-semibold mb-3 flex items-center gap-2">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                          </svg>
                                          Correct Answers ({q.correctStudents.length})
                                        </h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {q.correctStudents.map((student, idx) => (
                                            <div key={idx} className="bg-white rounded p-3 border border-green-300">
                                              <div className="font-medium text-green-900">{student.studentName}</div>
                                              <div className="text-sm text-green-700">{student.studentEmail}</div>
                                              <div className="text-sm text-green-800 mt-1">Answer: "{student.answer}"</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Incorrect answers section */}
                                    {q.incorrectStudents.length > 0 && (
                                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-300">
                                        <h5 className="text-orange-800 font-semibold mb-3 flex items-center gap-2">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                          </svg>
                                          Incorrect Answers ({q.incorrectStudents.length})
                                        </h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {q.incorrectStudents.map((student, idx) => (
                                            <div key={idx} className="bg-white rounded p-3 border border-orange-300">
                                              <div className="font-medium text-orange-900">{student.studentName}</div>
                                              <div className="text-sm text-orange-700">{student.studentEmail}</div>
                                              <div className="text-sm text-orange-800 mt-1">Answer: "{student.answer}"</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}

