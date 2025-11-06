import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaUpload, FaPaste, FaTrash, FaEdit, FaPlus, FaSave, FaTimes } from 'react-icons/fa';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

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
  const [showDropdown, setShowDropdown] = useState(false);

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

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [moduleText, setModuleText] = useState('');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  // const [createdQuizzes, setCreatedQuizzes] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editQ, setEditQ] = useState({});
  const [quizType, setQuizType] = useState('mixed');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [questionTime, setQuestionTime] = useState(30);
  // const [isProcessingFile, setIsProcessingFile] = useState(false);
  // const [selectedQuizId, setSelectedQuizId] = useState(null);
  // const [showCreatedQuizzes, setShowCreatedQuizzes] = useState(false);
  // const [showSubmissions, setShowSubmissions] = useState(false);
  const bounceRef = useRef();
  const dropdownRef = useRef();

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
      alert(`File type not supported. Please upload: ${allowedExtensions.join(', ')} files`);
      e.target.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit for all file types
      alert('File size too large. Maximum size is 50MB.');
      e.target.value = '';
      return;
    }

    // setIsProcessingFile(true);

    try {
      if (file.type === 'text/plain' || fileExtension === 'txt') {
        // Handle text files directly
        const text = await file.text();
        setModuleText(text);
        alert(`Text file loaded successfully! ${text.length} characters imported.`);
      } else {
        // Handle other file types using backend AI processing
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_BASE_URL}/files/extract-text`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minutes
        });

        if (response.data && response.data.text) {
          setModuleText(response.data.text);
          alert(`File content extracted successfully! Extracted ${response.data.text.length} characters from your ${response.data.originalFileName}.`);
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
      
      alert(errorMessage);
    } finally {
      // setIsProcessingFile(false);
      e.target.value = ''; // Reset file input
    }
  };

  // Generate quiz questions from module text using backend AI
  const handleGenerate = async () => {
    if (count < 1) return alert('Enter a valid number of questions.');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/quizzes/generate`, {
        count,
        moduleText: moduleText.trim() ? moduleText : undefined,
        quizType: quizType !== 'mixed' ? quizType : undefined,
      });
      if (response.data && Array.isArray(response.data.questions)) {
        // If quizType is 'mcq', force all generated questions with options to type 'mcq'
        let fixedQuestions = response.data.questions;
        if (quizType === 'mcq') {
          fixedQuestions = fixedQuestions.map(q => {
            if (Array.isArray(q.options) && q.options.length > 0) {
              return { ...q, type: 'mcq', displayType: 'Multiple Choice' };
            }
            return q;
          });
        }
        setQuestions(fixedQuestions);
      } else {
        alert('No questions generated.');
      }
    } catch {
      alert('Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
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
    setQuestions((qs) => qs.map((q, i) => (i === editingIdx ? editQ : q)));
    setEditingIdx(null);
    setEditQ({});
  };
  const handleDelete = (idx) => {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  };

  // Save quiz to class
  const handleSaveQuiz = async () => {
    if (!title) return alert('Quiz title required');
    setLoading(true);
    try {
      // Normalize question types for backend
      const normalizedQuestions = questions.map(q => {
        let type = q.type;
        // If options exist and length > 0, always treat as MCQ
        if (Array.isArray(q.options) && q.options.length > 0) {
          type = 'mcq';
        } else if (type === 'multiple' || type === 'mcq') {
          type = 'mcq';
        } else if (type === 'truefalse' || type === 'true_false') {
          type = 'true_false';
        } else if (type === 'identification') {
          type = 'identification';
        } else if (type === 'numeric') {
          type = 'identification';
        }
        return { ...q, type };
      });
      await axios.post(`${API_BASE_URL}/quizzes`, {
        classId,
        title,
        questions: normalizedQuestions,
        createdBy: teacherId,
        dueDate,
        questionTime,
      });
      alert('Quiz saved!');
      setQuestions([]); setTitle(''); setModuleText('');
      // Created quizzes refresh removed
    } catch {
      alert('Failed to save quiz.');
    } finally {
      setLoading(false);
    }
  };

  // Delete quiz function
  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
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
      alert('Quiz deleted successfully!');
    } catch {
      alert('Failed to delete quiz. Please try again.');
    }
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

  // Save Quiz Button outside main box, only visible if questions.length > 0, with bounce animation (force re-trigger on questions change)
  useEffect(() => {
    if (questions.length > 0 && bounceRef.current) {
      bounceRef.current.classList.remove('animate-bounceOnce');
      // Force reflow
      void bounceRef.current.offsetWidth;
      bounceRef.current.classList.add('animate-bounceOnce');
    }
  }, [questions.length]);

  // Wrap the whole return in a single centered div
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-[#181a20] via-[#23263a] to-[#1e2746] py-4 sm:py-6 lg:py-10 px-2 sm:px-4">{/* Improved responsive padding */}
      {/* Quiz Actions Dropdown at the top */}
      <div className="w-full flex justify-center sm:justify-end max-w-[95vw] sm:max-w-[90vw] xl:max-w-[1600px] mb-4 sm:mb-6 relative">
        <div className="relative" ref={dropdownRef}>
          <button
            className="bg-gradient-to-r from-indigo-700 to-purple-800 hover:from-indigo-800 hover:to-purple-900 text-white px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl font-bold shadow-lg border-2 border-indigo-400 hover:border-purple-500 transition-all duration-200 flex items-center gap-2 text-sm sm:text-base"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            Quiz Actions
            <svg className={`w-5 h-5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-64 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl shadow-2xl border-2 border-indigo-500 z-50">
              <div className="py-2">
                <button
                  className="w-full px-4 sm:px-6 py-3 text-left text-white hover:bg-purple-800/50 transition-colors flex items-center gap-3 text-sm sm:text-base"
                  onClick={() => {
                    setShowAnalyticsModal(true);
                    setShowDropdown(false);
                  }}
                >
                  <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  <div>
                    <div className="font-semibold">Quiz Analytics</div>
                    <div className="text-sm text-indigo-300">View performance insights</div>
                  </div>
                </button>
                <button
                  className="w-full px-4 sm:px-6 py-3 text-left text-white hover:bg-green-800/50 transition-colors flex items-center gap-3 text-sm sm:text-base"
                  onClick={() => {
                    setShowSubModal(true);
                    setShowDropdown(false);
                  }}
                >
                  <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <div>
                    <div className="font-semibold">View All Submissions</div>
                    <div className="text-sm text-green-300">Student quiz responses</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="w-full max-w-[95vw] sm:max-w-[90vw] xl:max-w-[1600px] p-2 sm:p-6 lg:p-10 bg-gradient-to-br from-[#181a20] via-[#23263a] to-[#1e2746] rounded-xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-indigo-900 overflow-hidden max-h-[85vh] sm:max-h-[88vh] lg:max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500 hover:scrollbar-thumb-indigo-400 scrollbar-track-indigo-900/30 relative scroll-smooth">
        <div className="bg-gradient-to-r from-indigo-900 to-blue-900 px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-4 border-b-2 sm:border-b-4 border-indigo-800 shadow-lg justify-center sticky top-0 z-10">{/* Made header sticky */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg tracking-wide flex items-center gap-3 justify-center">
            <svg className="w-10 h-10 text-green-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v1.5m9 0v1.5m0-1.5h-9m9 0a2.25 2.25 0 012.25 2.25v8.25A2.25 2.25 0 0116.5 20.25h-9A2.25 2.25 0 015.25 18V9a2.25 2.25 0 012.25-2.25h9z" /></svg>
            Quiz Generator
          </h2>
        </div>
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24 min-h-full">{/* Enhanced responsive padding with more bottom space */}
        <h3 className="text-xl font-bold mb-2 text-indigo-200 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Module Upload / Paste
        </h3>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer bg-[#23263a] hover:bg-[#23263a]/80 border-2 border-indigo-900 px-4 py-2 rounded-lg shadow-md transition group">
            <FaUpload className="text-indigo-300 group-hover:text-green-400 transition" />
            <input type="file" accept=".txt,.pdf,.jpg,.jpeg,.png,.docx,.doc,.pptx,.ppt" className="hidden" onChange={handleFileChange} />
            <span className="font-medium text-indigo-200 group-hover:text-green-400 transition">Upload file</span>
          </label>
          <label className="flex-1 flex items-start gap-2">
            <FaPaste className="mt-2 text-indigo-400" />
            <textarea
              className="border-2 border-indigo-900 bg-[#23263a] text-indigo-100 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-indigo-400 shadow-md"
              rows={5}
              placeholder="Paste module text here..."
              value={moduleText}
              onChange={e => setModuleText(e.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2 bg-[#23263a] border-2 border-indigo-900 rounded-lg px-4 py-2 shadow">
            <label className="text-indigo-200 font-semibold">Number of Questions:</label>
            <input
              type="number"
              min={1}
              max={100}
              className="w-20 border border-indigo-700 rounded bg-[#23263a] text-indigo-100 p-1 focus:ring-2 focus:ring-green-400"
              value={count}
              onChange={e => setCount(Math.max(1, Number(e.target.value)))}
              required
            />
          </div>
          <div className="flex items-center gap-2 bg-[#23263a] border-2 border-indigo-900 rounded-lg px-4 py-2 shadow">
            <label className="text-indigo-200 font-semibold">Quiz Type:</label>
            <select
              className="border border-indigo-700 rounded bg-[#23263a] text-indigo-100 p-1 focus:ring-2 focus:ring-green-400"
              value={quizType}
              onChange={e => setQuizType(e.target.value)}
            >
              <option value="mixed">Mixed</option>
              <option value="mcq">Multiple Choice</option>
              <option value="true_false">True or False</option>
              <option value="identification">Identification</option>
            </select>
          </div>
        </div>
        <button
          className="bg-gradient-to-r from-indigo-800 to-blue-800 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:from-indigo-900 hover:to-blue-900 transition mb-8 w-full text-lg disabled:opacity-60 tracking-wider focus:ring-4 focus:ring-green-400"
          onClick={handleGenerate}
          disabled={loading || !moduleText}
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <svg className="w-6 h-6 animate-spin text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
              Generating...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Generate Quiz
            </span>
          )}
        </button>

        {questions.length > 0 && (
          <>
            <div className="border-b-2 border-indigo-900 mb-6"></div>
            <h3 className="text-2xl font-bold mb-4 text-indigo-200 flex items-center gap-2">Quiz Questions</h3>
            <div className="flex flex-col gap-4 mb-8">
              {questions.map((q, idx) => {
                // Ensure MCQ always has a correct answer
                let correctAnswer = q.answer;
                if (q.type === 'mcq' && (!correctAnswer || !q.options?.includes(correctAnswer))) {
                  // Default to first option if answer is missing or invalid
                  correctAnswer = q.options && q.options.length > 0 ? q.options[0] : '';
                }
                return (
                  <div key={idx} className="border-2 border-indigo-900 rounded-xl bg-[#23263a] p-4 shadow flex flex-col gap-2 relative">
                    {editingIdx === idx ? (
                      <>
                        <input
                          className="border-2 border-indigo-700 bg-[#23263a] text-indigo-100 rounded p-2 mb-2 w-full text-lg"
                          value={editQ.question}
                          onChange={e => handleEditChange('question', e.target.value)}
                        />
                        {q.type === 'mcq' && (
                          <>
                            <textarea
                              className="border-2 border-indigo-900 bg-[#23263a] text-indigo-100 rounded p-2 mb-2 w-full"
                              value={editQ.options?.join('\n')}
                              onChange={e => handleEditChange('options', e.target.value.split('\n'))}
                              placeholder="Options (one per line)"
                            />
                            <label className="block text-green-300 font-semibold mb-2">Correct Answer</label>
                            <select
                              className="border-2 border-green-700 bg-[#23263a] text-green-100 rounded p-2 mb-2 w-full"
                              value={editQ.answer || (editQ.options && editQ.options[0]) || ''}
                              onChange={e => handleEditChange('answer', e.target.value)}
                            >
                              {editQ.options && editQ.options.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </>
                        )}
                        {q.type === 'true_false' && (
                          <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-2">
                              <input type="radio" name={`editQ${idx}`} value="True" checked={editQ.answer === 'True'} onChange={()=>handleEditChange('answer', 'True')} /> True
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="radio" name={`editQ${idx}`} value="False" checked={editQ.answer === 'False'} onChange={()=>handleEditChange('answer', 'False')} /> False
                            </label>
                          </div>
                        )}
                        {q.type === 'identification' && (
                          <input
                            className="border-2 border-indigo-900 bg-[#23263a] text-indigo-100 rounded p-2 mb-2 w-full"
                            value={editQ.answer}
                            onChange={e => handleEditChange('answer', e.target.value)}
                            placeholder="Type the correct answer here"
                          />
                        )}
                        {/* fallback for other types */}
                        {q.type !== 'mcq' && q.type !== 'true_false' && q.type !== 'identification' && (
                          <input
                            className="border-2 border-indigo-900 bg-[#23263a] text-indigo-100 rounded p-2 mb-2 w-full"
                            value={editQ.answer}
                            onChange={e => handleEditChange('answer', e.target.value)}
                            placeholder="Answer"
                          />
                        )}
                        <div className="flex gap-2 mt-2">
                          <button className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded shadow" onClick={handleSaveEdit}><FaSave /></button>
                          <button className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded shadow" onClick={() => setEditingIdx(null)}><FaTimes /></button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-lg text-white drop-shadow" style={{textShadow:'0 1px 4px #23263a'}}> {q.question} </div>
                        <div className="text-sm italic text-green-300 font-bold tracking-wide mb-1">Type: {q.displayType || q.type.toUpperCase()}</div>
                        {q.type === 'mcq' && (
                          <>
                            <ul className="list-disc ml-6 text-green-200 text-base font-semibold">
                              {q.options.map((opt, i) => <li key={i} className="mb-1">{opt}</li>)}
                            </ul>
                            <div className="flex items-center gap-2 bg-[#181a20] border-2 border-green-700 rounded-lg px-4 py-2 shadow-md w-fit mt-2">
                              <span className="font-semibold text-green-300 mr-2">Correct Answer:</span>
                              <span className="bg-green-600 text-white px-3 py-1 rounded-lg font-bold tracking-wide shadow" style={{letterSpacing:'1px'}}>{correctAnswer || ''}</span>
                            </div>
                          </>
                        )}
                        {q.type === 'true_false' && (
                          <div className="flex gap-4 mb-2">
                            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md cursor-pointer transition-all border-2 ${q.answer === 'True' ? 'bg-green-600 text-white border-green-400' : 'bg-[#181a20] text-green-200 border-green-700'}` }>
                              <input type="radio" name={`viewQ${idx}`} value="True" checked={q.answer === 'True'} readOnly className="accent-green-400" />
                              <span className="font-bold">True</span>
                            </label>
                            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md cursor-pointer transition-all border-2 ${q.answer === 'False' ? 'bg-red-600 text-white border-red-400' : 'bg-[#181a20] text-red-200 border-red-700'}` }>
                              <input type="radio" name={`viewQ${idx}`} value="False" checked={q.answer === 'False'} readOnly className="accent-red-400" />
                              <span className="font-bold">False</span>
                            </label>
                          </div>
                        )}
                        {q.type === 'identification' && (
                          <div className="flex items-center gap-2 bg-[#181a20] border-2 border-green-700 rounded-lg px-4 py-2 shadow-md w-fit">
                            <span className="font-semibold text-green-300 mr-2">Correct Answer:</span>
                            <span className="bg-green-600 text-white px-3 py-1 rounded-lg font-bold tracking-wide shadow" style={{letterSpacing:'1px'}}>{q.answer || ''}</span>
                          </div>
                        )}
                        {q.type !== 'mcq' && q.type !== 'true_false' && q.type !== 'identification' && (
                          <div className="text-sm">Answer: <span className="font-bold text-indigo-300">{q.answer?.toString()}</span></div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded shadow" onClick={() => handleEdit(idx)}><FaEdit /></button>
                          <button className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded shadow" onClick={() => handleDelete(idx)}><FaTrash /></button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
        {/* Save Quiz Button outside main box, only visible if questions.length > 0, with bounce animation */}
        {questions.length > 0 && (
          <div ref={bounceRef} className="fixed bottom-8 right-8 z-50">
            <button
              className="relative bg-gradient-to-br from-green-600 via-green-700 to-blue-800 text-white px-10 py-4 rounded-3xl font-extrabold shadow-2xl hover:from-green-800 hover:to-blue-900 transition text-xl animate-slideInRight animate-bounceOnce border-4 border-green-400 hover:border-blue-500 focus:ring-4 focus:ring-green-300 focus:outline-none group overflow-hidden"
              onClick={() => setShowSaveModal(true)}
              disabled={loading}
            >
              <span className="absolute left-0 top-0 w-full h-full bg-green-400 opacity-0 group-hover:opacity-10 transition-all rounded-3xl"></span>
              <span className="flex items-center gap-2">
                <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Save Quiz to Class
              </span>
            </button>
          </div>
        )}
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-8 shadow-2xl w-full max-w-md border-4 border-indigo-500 animate-fadeIn pointer-events-auto relative">
              <button
                className="absolute top-4 right-4 text-indigo-200 hover:text-white text-2xl font-bold focus:outline-none"
                onClick={() => setShowSaveModal(false)}
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
                  onClick={async () => { await handleSaveQuiz(); setShowSaveModal(false); }}
                  disabled={loading || !title || questions.length === 0}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Created Quizzes and Student Submissions Section */}
        {questions.length === 0 && (
          <div className="mt-6 sm:mt-8 mb-12 sm:mb-16">{/* Enhanced responsive margins */}
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-indigo-200">Your Quizzes</h2>
            {subLoading ? (
              <div className="text-indigo-300 p-4 bg-indigo-900/20 rounded-lg animate-pulse">Loading quizzes and submissions...</div>
            ) : createdQuizzes.length === 0 ? (
              <div className="bg-[#23263a] rounded-lg p-6 sm:p-8 shadow-lg border border-indigo-800/50">
                <p className="text-indigo-300 text-center">No quizzes created yet. Generate a quiz using the module text.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">{/* Improved spacing using space-y */}
                {createdQuizzes.map(quiz => (
                  <div key={quiz._id} className="bg-gradient-to-r from-[#23263a] to-[#2a2f45] rounded-xl p-4 sm:p-6 shadow-lg border border-indigo-700/30 hover:border-indigo-600/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div className="flex-1 min-w-0 space-y-2">{/* Added space-y for better vertical spacing */}
                        <div className="font-bold text-lg sm:text-xl text-indigo-100 break-words leading-tight">{quiz.title}</div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="text-indigo-300 text-sm bg-indigo-900/30 px-3 py-1 rounded-full inline-flex items-center gap-2">
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
                          <div className="text-indigo-200 text-sm bg-blue-900/30 px-3 py-1 rounded-full inline-flex items-center gap-2">
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
        )}

        {/* Submissions Modal - all quizzes */}
        {showSubModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-gradient-to-br from-green-900 to-blue-900 rounded-2xl p-8 shadow-2xl w-full max-w-4xl border-4 border-green-500 animate-fadeIn pointer-events-auto relative">
              <button
                className="absolute top-4 right-4 text-green-200 hover:text-white text-2xl font-bold focus:outline-none"
                onClick={() => setShowSubModal(false)}
              >
                ×
              </button>
              <h2 className="text-2xl font-extrabold text-white mb-4">All Student Submissions</h2>
              <div className="overflow-x-auto max-h-[70vh]">
                {createdQuizzes.length === 0 ? (
                  <div className="text-green-300">No quizzes created yet.</div>
                ) : (
                  createdQuizzes.map(quiz => (
                    <div key={quiz._id} className="mb-8">
                      <div className="font-bold text-lg text-green-100 mb-2">{quiz.title}</div>
                      <table className="min-w-full text-green-100 text-sm border border-green-600 rounded-lg mb-2">
                        <thead>
                          <tr className="bg-gradient-to-r from-green-800 to-blue-800 text-white">
                            <th className="px-3 py-2 border-b border-green-600">Student Name</th>
                            <th className="px-3 py-2 border-b border-green-600">Student Email</th>
                            <th className="px-3 py-2 border-b border-green-600">Score</th>
                            <th className="px-3 py-2 border-b border-green-600">Submitted At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(submissionsByQuiz[quiz._id] || []).length === 0 ? (
                            <tr><td colSpan="4" className="text-green-400 text-center py-3">No submissions yet.</td></tr>
                          ) : (
                            submissionsByQuiz[quiz._id].map((sub, i) => (
                              <tr key={sub._id || i} className="border-b border-green-700 hover:bg-green-800/20 transition-colors">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-8 shadow-2xl w-full max-w-6xl border-4 border-purple-500 animate-fadeIn pointer-events-auto relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-purple-200 hover:text-white text-2xl font-bold focus:outline-none"
                onClick={() => setShowAnalyticsModal(false)}
              >
                ×
              </button>
              <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-3">
                <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Quiz Analytics Dashboard
              </h2>
              <div className="space-y-8">
                {(() => {
                  const analytics = calculateQuizAnalytics();
                  if (analytics.length === 0) {
                    return (
                      <div className="text-purple-300 text-center py-8">
                        No quiz data available for analytics. Students need to submit quizzes first.
                      </div>
                    );
                  }
                  return analytics.map(({ quiz, totalSubmissions, questionAnalytics }) => (
                    <div key={quiz._id} className="bg-purple-800/30 rounded-xl p-6 border border-purple-600">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-purple-100">{quiz.title}</h3>
                        <span className="bg-purple-700 text-purple-100 px-3 py-1 rounded-full text-sm">
                          {totalSubmissions} submissions
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Overall Stats */}
                        <div className="bg-purple-900/50 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-purple-200 mb-3">Overall Performance</h4>
                          <div className="space-y-2">
                            {(() => {
                              const avgDifficulty = questionAnalytics.reduce((sum, q) => sum + q.difficultyPercentage, 0) / questionAnalytics.length;
                              const avgSuccess = questionAnalytics.reduce((sum, q) => sum + q.successPercentage, 0) / questionAnalytics.length;
                              return (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-purple-300">Average Success Rate:</span>
                                    <span className="text-green-400 font-bold">{Math.round(avgSuccess)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-purple-300">Average Difficulty:</span>
                                    <span className="text-red-400 font-bold">{Math.round(avgDifficulty)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-purple-300">Total Questions:</span>
                                    <span className="text-purple-200 font-bold">{questionAnalytics.length}</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Difficult Questions */}
                        <div className="bg-purple-900/50 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-purple-200 mb-3">Most Difficult Questions</h4>
                          <div className="space-y-3">
                            {questionAnalytics
                              .sort((a, b) => b.difficultyPercentage - a.difficultyPercentage)
                              .slice(0, 3)
                              .map((q) => (
                                <div key={q.questionIndex} className="border-l-4 border-red-500 pl-3">
                                  <div className="text-sm text-purple-200">Question {q.questionIndex + 1}</div>
                                  <div className="text-red-400 font-bold">{q.difficultyPercentage}% incorrect</div>
                                  <div className="text-xs text-purple-300 truncate">{q.question}</div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      {/* Detailed Question Analysis */}
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-purple-200 mb-4">Question-by-Question Analysis</h4>
                        <div className="space-y-4">
                          {questionAnalytics.map(q => {
                            const questionKey = `${quiz._id}-${q.questionIndex}`;
                            const isExpanded = expandedQuestions[questionKey];
                            
                            return (
                              <div key={q.questionIndex} className="bg-purple-900/30 rounded-lg p-4 border border-purple-700">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <div className="font-semibold text-purple-100">Q{q.questionIndex + 1}: {q.question}</div>
                                    <div className="text-sm text-purple-300 mt-1">Correct Answer: {String(q.correctAnswer)}</div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className={`text-lg font-bold ${q.difficultyPercentage > 50 ? 'text-red-400' : q.difficultyPercentage > 25 ? 'text-yellow-400' : 'text-green-400'}`}>
                                      {q.successPercentage}% correct
                                    </div>
                                    <div className="text-sm text-purple-300">{q.totalAttempts} attempts</div>
                                  </div>
                                </div>
                                
                                {/* Progress bar */}
                                <div className="w-full bg-purple-800 rounded-full h-3 mb-3">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${q.successPercentage}%` }}
                                  ></div>
                                </div>
                                
                                {/* Common wrong answers */}
                                {q.commonWrongAnswers.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-sm font-semibold text-purple-200 mb-2">Common Wrong Answers:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {q.commonWrongAnswers.map((wrong, idx) => (
                                        <span key={idx} className="bg-red-900/50 text-red-200 px-2 py-1 rounded text-xs border border-red-700">
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
                                    className="bg-purple-700 hover:bg-purple-600 text-purple-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
                                      <div className="bg-green-900/20 rounded-lg p-4 border border-green-700">
                                        <h5 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                          </svg>
                                          Correct Answers ({q.correctStudents.length})
                                        </h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {q.correctStudents.map((student, idx) => (
                                            <div key={idx} className="bg-green-800/30 rounded p-3 border border-green-600">
                                              <div className="font-medium text-green-100">{student.studentName}</div>
                                              <div className="text-sm text-green-300">{student.studentEmail}</div>
                                              <div className="text-sm text-green-200 mt-1">Answer: "{student.answer}"</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Incorrect answers section */}
                                    {q.incorrectStudents.length > 0 && (
                                      <div className="bg-red-900/20 rounded-lg p-4 border border-red-700">
                                        <h5 className="text-red-300 font-semibold mb-3 flex items-center gap-2">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                          </svg>
                                          Incorrect Answers ({q.incorrectStudents.length})
                                        </h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {q.incorrectStudents.map((student, idx) => (
                                            <div key={idx} className="bg-red-800/30 rounded p-3 border border-red-600">
                                              <div className="font-medium text-red-100">{student.studentName}</div>
                                              <div className="text-sm text-red-300">{student.studentEmail}</div>
                                              <div className="text-sm text-red-200 mt-1">Answer: "{student.answer}"</div>
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
    {/* Save Quiz Button outside main box, only visible if questions.length > 0, with bounce animation */}
    {questions.length > 0 && (
      <div ref={bounceRef} className="fixed bottom-8 right-8 z-50">
        <button
          className="relative bg-gradient-to-br from-green-600 via-green-700 to-blue-800 text-white px-10 py-4 rounded-3xl font-extrabold shadow-2xl hover:from-green-800 hover:to-blue-900 transition text-xl animate-slideInRight animate-bounceOnce border-4 border-green-400 hover:border-blue-500 focus:ring-4 focus:ring-green-300 focus:outline-none group overflow-hidden"
          onClick={() => setShowSaveModal(true)}
          disabled={loading}
        >
          <span className="absolute left-0 top-0 w-full h-full bg-green-400 opacity-0 group-hover:opacity-10 transition-all rounded-3xl"></span>
          <span className="flex items-center gap-2">
            <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Save Quiz to Class
          </span>
        </button>
      </div>
    )}
    {showSaveModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-8 shadow-2xl w-full max-w-md border-4 border-indigo-500 animate-fadeIn pointer-events-auto relative">
          <button
            className="absolute top-4 right-4 text-indigo-200 hover:text-white text-2xl font-bold focus:outline-none"
            onClick={() => setShowSaveModal(false)}
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
            min={5}
            max={600}
            className="border-2 border-indigo-700 bg-[#23263a] text-indigo-100 rounded-lg p-2 w-full mb-4 focus:ring-2 focus:ring-green-400"
            value={questionTime}
            onChange={e => setQuestionTime(Number(e.target.value))}
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
              onClick={async () => { await handleSaveQuiz(); setShowSaveModal(false); }}
              disabled={loading || !title || questions.length === 0}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )}
  {/* Top Save Quiz button removed; only floating Save Quiz button remains */}

  {/* Created Quizzes Modal removed */}
    {/* Quiz Submissions Modal - only visible when showSubmissions is true */}

  </div>
);
}

/* Add animation styles to your Admin/src/index.css or a global CSS file:
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slideInRight {
  animation: slideInRight 0.4s cubic-bezier(0.4,0,0.2,1);
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease;
}
@keyframes bounceOnce {
  0% { transform: translateY(100px); opacity: 0; }
  60% { transform: translateY(-20px); opacity: 1; }
  80% { transform: translateY(10px); }
  100% { transform: translateY(0); }
}
.animate-bounceOnce {
  animation: bounceOnce 0.7s cubic-bezier(0.4,0,0.2,1);
}
*/
