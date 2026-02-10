import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaListOl, FaPlus, FaEye, FaArrowLeft, FaArrowRight, FaPen, FaSave } from 'react-icons/fa';
import { useParams, NavLink } from 'react-router-dom';
import SidebarContext from '../contexts/SidebarContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";


const QuizzHub = () => {
  // Popup state for quiz start
  const [showStartModal, setShowStartModal] = useState(false);
  const [pendingQuizId, setPendingQuizId] = useState(null);
  const { classId } = useParams();
  const { isSidebarOpen } = useContext(SidebarContext);
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user?._id;

  // Quiz info
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questionTimers, setQuestionTimers] = useState([]); // seconds left per question
  const timerRef = useRef();
  const activeQuizRef = useRef(null);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizzes, setQuizzes] = useState([]);

  // Fetch quizzes for this class
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
  const res = await axios.get(`${API_BASE_URL}/quizzes/class/${classId}?studentId=${studentId}`);
  setQuizzes(res.data || []);
      } catch {
        setError('Failed to fetch quizzes.');
      } finally {
        setLoading(false);
      }
    };
    if (classId) fetchQuizzes();
  }, [classId, studentId]);

  // Reset timer and question state when quiz is activated
  useEffect(() => {
    if (activeQuizId) {
      const quiz = quizzes.find(qz => qz._id === activeQuizId);
      if (quiz && quiz.questions) {
        setCurrentQuestion(0);
        // Use the quiz's questionTime if available, otherwise default to 30 seconds
        const timePerQuestion = quiz.questionTime || 30;
        setQuestionTimers(Array(quiz.questions.length).fill(timePerQuestion));
        // Auto-scroll to quiz after a short delay
        setTimeout(() => {
          if (activeQuizRef.current) {
            activeQuizRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    }
  }, [activeQuizId, quizzes]);

  // Timer effect for current question
  useEffect(() => {
    if (!activeQuizId) return;
    const quiz = quizzes.find(qz => qz._id === activeQuizId);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return;
    if (currentQuestion >= quiz.questions.length) return;
    if (questionTimers[currentQuestion] <= 0) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setQuestionTimers(prev => {
        if (prev[currentQuestion] <= 0) return prev;
        const updated = [...prev];
        updated[currentQuestion] = Math.max(0, updated[currentQuestion] - 1);
        return updated;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQuestion, activeQuizId, quizzes, questionTimers]);

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (!activeQuizId) return;
    const quiz = quizzes.find(qz => qz._id === activeQuizId);
    if (!quiz || !quiz.questions) return;
    if (questionTimers[currentQuestion] === 0) {
      if (currentQuestion < quiz.questions.length - 1) {
        setTimeout(() => setCurrentQuestion(currentQuestion + 1), 1000);
      }
    }
  }, [questionTimers, currentQuestion, activeQuizId, quizzes]);

  // Scroll to quiz when question changes
  useEffect(() => {
    if (activeQuizId && activeQuizRef.current) {
      activeQuizRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentQuestion, activeQuizId]);

  // Add question to quiz
  // (Removed unused addQuestion function)

  // Handle answer change
  const handleAnswer = (qid, value) => {
    setStudentAnswers({ ...studentAnswers, [qid]: value });
  };

  // Submit quiz answers
  const submitQuiz = async (quizId) => {
    setLoading(true);
    try {
      // Transform studentAnswers object to array of { questionIndex, answer }
      const answersArr = Object.entries(studentAnswers).map(([questionIndex, answer]) => ({
        questionIndex: Number(questionIndex),
        answer
      }));
      const res = await axios.post(`${API_BASE_URL}/quizzes/${quizId}/submit`, {
        studentId,
        answers: answersArr,
      });
      setScore(res.data.score);
      setShowScore(true);
      // Immediately fetch quizzes to update submissions UI
      try {
        const refreshed = await axios.get(`${API_BASE_URL}/quizzes/class/${classId}?studentId=${studentId}`);
        setQuizzes(refreshed.data || []);
      } catch {
        // Error intentionally ignored
      }
    } catch {
      setError('Failed to submit quiz.');
    } finally {
      setLoading(false);
    }
  };


  // Render quiz creation (for teachers)
  const [showCreate, setShowCreate] = useState(false);
  const [newQuiz, setNewQuiz] = useState({ title: '', description: '', dueDate: '', questions: [] });
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/quizzes`, {
        ...newQuiz,
        classId,
        createdBy: user?._id,
      });
      setCreateSuccess('Quiz created successfully!');
      setShowCreate(false);
      setNewQuiz({ title: '', description: '', dueDate: '', questions: [] });
      // Refresh quizzes
      const refreshed = await axios.get(`${API_BASE_URL}/quizzes/class/${classId}`);
      setQuizzes(refreshed.data || []);
    } catch {
      setCreateError('Failed to create quiz.');
    }
  };

  const renderQuizCreation = () => (
  <div className="mb-4 sm:mb-6 md:mb-8 p-2 sm:p-3 md:p-4 bg-white border-blue-200 rounded-lg sm:rounded-xl shadow-lg w-full max-w-none border">
  <h2 className="text-sm sm:text-lg font-bold mb-1 sm:mb-2 text-blue-900">Create New Quiz</h2>
      <form onSubmit={handleCreateQuiz}>
        <input className="input mb-2" type="text" placeholder="Title" value={newQuiz.title} onChange={e=>setNewQuiz({ ...newQuiz, title: e.target.value })} required />
        <textarea className="input mb-2" placeholder="Description" value={newQuiz.description} onChange={e=>setNewQuiz({ ...newQuiz, description: e.target.value })} required />
        <input className="input mb-2" type="date" value={newQuiz.dueDate} onChange={e=>setNewQuiz({ ...newQuiz, dueDate: e.target.value })} required />
        {/* For simplicity, only allow one question for now */}
        <input className="input mb-2" type="text" placeholder="Question" value={newQuiz.questions[0]?.question || ''} onChange={e=>setNewQuiz({ ...newQuiz, questions: [{ ...newQuiz.questions[0], question: e.target.value, type: 'multiple', choices: [], answer: '' }] })} required />
        <input className="input mb-2" type="text" placeholder="Choices (comma separated)" value={newQuiz.questions[0]?.choices?.join(',') || ''} onChange={e=>setNewQuiz({ ...newQuiz, questions: [{ ...newQuiz.questions[0], choices: e.target.value.split(','), type: 'multiple', answer: newQuiz.questions[0]?.answer || '' }] })} required />
        <input className="input mb-2" type="text" placeholder="Correct Answer" value={newQuiz.questions[0]?.answer || ''} onChange={e=>setNewQuiz({ ...newQuiz, questions: [{ ...newQuiz.questions[0], answer: e.target.value, type: 'multiple', choices: newQuiz.questions[0]?.choices || [] }] })} required />
  <button type="submit" className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-3 sm:px-4 md:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg text-xs sm:text-sm md:text-base transition"><FaPlus className="text-white text-xs sm:text-sm" /> <span className="hidden sm:inline">Create Quiz</span><span className="sm:hidden">Create</span></button>
  {createError && <div className="text-red-600 mt-2">{createError}</div>}
  {createSuccess && <div className="text-green-600 mt-2">{createSuccess}</div>}
      </form>
    </div>
  );

  // Render quiz list and take quiz
  const renderQuizList = () => (
    <div>
  <h2 className="text-sm sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4 flex items-center gap-1 sm:gap-2 text-blue-900"><FaListOl className="text-sm sm:text-base" /> <span className="hidden sm:inline">Available Quizzes</span><span className="sm:hidden">Quizzes</span></h2>
      {loading && <div className="text-blue-700">Loading quizzes...</div>}
  {error && <div className="text-red-600">{error}</div>}
      {quizzes.length === 0 && !loading ? (
        <div>No quizzes available.</div>
      ) : (
        quizzes.map((qz, idx) => {
          // Check if student has already taken this quiz
          const alreadyTaken = Array.isArray(qz.submissions) && qz.submissions.some(sub => sub.studentId === studentId);
          return (
            <div key={qz._id || idx} className="mb-3 sm:mb-4 md:mb-6 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-lg w-full max-w-none bg-gradient-to-r from-blue-50 via-white to-indigo-50 border-2 border-blue-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1 sm:mb-2">
                <div>
                  <div className="font-bold text-sm sm:text-base md:text-lg text-blue-900">{qz.title}</div>
                  <div className="text-blue-700 text-xs sm:text-sm mb-0.5 sm:mb-1">{qz.description}</div>
                  <div className="text-[10px] sm:text-xs text-blue-600 flex items-center gap-1"><FaCalendarAlt className="text-[10px] sm:text-xs" /> Due: {qz.dueDate ? new Date(qz.dueDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                {alreadyTaken ? (
                  <div className="flex flex-col items-start">
                    <button
                      className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-gray-400 to-gray-600 text-white px-3 sm:px-4 md:px-5 py-1 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg font-bold text-xs sm:text-sm md:text-base transition mt-1 sm:mt-2 md:mt-0 opacity-60 cursor-not-allowed"
                      disabled
                      title="You have already taken this quiz."
                    >
                      <FaPen className="text-white" /> Quiz Taken
                    </button>
                    {/* Show score below button */}
                    {Array.isArray(qz.submissions) && qz.submissions.filter(sub => sub.studentId === studentId).map((sub, i) => (
                      <div
                        key={i}
                        className="mt-2 sm:mt-3 inline-flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-600 via-green-500 to-green-400 shadow-lg border-2 border-green-400 animate-fade-in-up"
                        style={{ minWidth: '120px' }}
                      >
                        <FaCheckCircle className="text-white text-sm sm:text-xl drop-shadow" />
                        <span className="font-bold text-white text-[10px] sm:text-base tracking-wide">Score:</span>
                        <span className="ml-1 sm:ml-2 text-sm sm:text-2xl font-extrabold text-white drop-shadow-lg">{typeof sub.score === 'number' ? sub.score : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 sm:px-4 md:px-5 py-1 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg font-bold text-xs sm:text-sm md:text-base transition mt-1 sm:mt-2 md:mt-0"
                    onClick={() => {
                      setPendingQuizId(qz._id);
                      setShowStartModal(true);
                    }}
                    title="Take Quiz"
                  >
                    <FaPen className="text-white" /> Take Quiz
                  </button>
                )}
              </div>
            {/* Render questions if this quiz is active and not showing score */}
            {activeQuizId === qz._id && !showScore && (
              <div ref={activeQuizRef} className="mt-4 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-lg sm:rounded-xl shadow-lg border-2 border-amber-300 scroll-mt-20">
                <form onSubmit={e=>{e.preventDefault();submitQuiz(qz._id);}}>
                  {qz.questions && qz.questions.length > 0 && (
                    <div>
                      {/* Progress indicator */}
                      <div className="mb-4 sm:mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-semibold text-amber-800">Question {currentQuestion + 1} of {qz.questions.length}</span>
                          <span className="text-xs sm:text-sm font-semibold text-amber-800">{Math.round(((currentQuestion + 1) / qz.questions.length) * 100)}% Complete</span>
                        </div>
                        <div className="w-full bg-amber-200/50 rounded-full h-2 sm:h-3 overflow-hidden shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                            style={{ width: `${((currentQuestion + 1) / qz.questions.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="mb-3 sm:mb-4">
                        <div className="flex flex-col gap-2 sm:gap-3">
                          <span className="font-semibold text-sm sm:text-base md:text-lg text-amber-900 drop-shadow leading-relaxed" style={{textShadow:'0 1px 4px rgba(0,0,0,0.3)'}}>
                            {currentQuestion+1}. {qz.questions[currentQuestion].question}
                          </span>
                          <span className="text-red-700 font-bold text-xs sm:text-base md:text-lg bg-amber-200 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow self-start flex items-center gap-1">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                            </svg>
                            Time: {questionTimers[currentQuestion]}s
                          </span>
                        </div>
                      {/* Render answer input for current question only */}
                      {(() => {
                        const q = qz.questions[currentQuestion];
                        const i = currentQuestion;
                        let type = (q.type || '').toLowerCase();
                        if (['multiple', 'mcq', 'multiple_choice'].includes(type)) type = 'mcq';
                        else if (['truefalse', 'true_false', 'true/false', 'tf', 'true or false'].includes(type) || /true or false|true|false/i.test(q.question)) type = 'true_false';
                        else if (['identification', 'numeric'].includes(type)) type = 'identification';
                        // Enhanced: Detect MCQ by presence of choices (A., B., etc) even if no type, else fallback to identification
                        let answerInput = null;
                        // Detect MCQ by options/choices or by question text containing lettered choices
                        let detectedMCQ = false;
                        let mcqChoices = null;
                        if(type==='mcq' && (q.options || q.choices)) {
                          detectedMCQ = true;
                          mcqChoices = q.options || q.choices;
                        } else if(Array.isArray(q.choices) && q.choices.length > 0) {
                          detectedMCQ = true;
                          mcqChoices = q.choices;
                        } else if(Array.isArray(q.options) && q.options.length > 0) {
                          detectedMCQ = true;
                          mcqChoices = q.options;
                        } else if(typeof q.question === 'string') {
                          // More strict MCQ detection - require proper pattern with all options A-D
                          const mcqPattern = /A\.\s*[^A-D]*B\.\s*[^A-D]*C\.\s*[^A-D]*D\.\s*/;
                          const match = q.question.match(mcqPattern);
                          if(match) {
                            // Extract choices from question text
                            const fullMatch = match[0];
                            const choices = fullMatch.split(/[A-D]\.\s*/).filter(c => c.trim().length > 0);
                            if(choices.length >= 4) {
                              mcqChoices = choices.slice(0, 4).map((choice, idx) => String.fromCharCode(65 + idx) + '. ' + choice.trim());
                              detectedMCQ = true;
                            }
                          }
                        }
                        if(type==='true_false') {
                          answerInput = (
                            <div className="w-full mt-3 sm:mt-4">
                              <span className="block text-amber-800 font-semibold mb-2 sm:mb-3 text-xs sm:text-base">
                                True or False:
                              </span>
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                <label className={`flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg cursor-pointer transition-all duration-200 border-2 flex-1 min-h-[48px] ${studentAnswers[i]==='True' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400 shadow-green-500/30 scale-105' : 'bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 border-amber-400/70 hover:border-green-500/70 hover:bg-gradient-to-r hover:from-green-200/50 hover:to-green-100/50 active:scale-95'}` }>
                                  <input 
                                    type="radio" 
                                    name={`q${i}`} 
                                    value="True" 
                                    checked={studentAnswers[i]==='True'} 
                                    onChange={()=>handleAnswer(i,'True')} 
                                    className="accent-green-400 w-4 h-4 sm:w-5 sm:h-5" 
                                    disabled={questionTimers[i]===0} 
                                  />
                                  <span className="font-bold text-sm sm:text-base">True</span>
                                </label>
                                <label className={`flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg cursor-pointer transition-all duration-200 border-2 flex-1 min-h-[48px] ${studentAnswers[i]==='False' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400 shadow-red-500/30 scale-105' : 'bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 border-amber-400/70 hover:border-red-500/70 hover:bg-gradient-to-r hover:from-red-200/50 hover:to-red-100/50 active:scale-95'}` }>
                                  <input 
                                    type="radio" 
                                    name={`q${i}`} 
                                    value="False" 
                                    checked={studentAnswers[i]==='False'} 
                                    onChange={()=>handleAnswer(i,'False')} 
                                    className="accent-red-400 w-4 h-4 sm:w-5 sm:h-5" 
                                    disabled={questionTimers[i]===0} 
                                  />
                                  <span className="font-bold text-sm sm:text-base">False</span>
                                </label>
                              </div>
                            </div>
                          );
                        } else if(detectedMCQ && mcqChoices && mcqChoices.length > 0) {
                          answerInput = (
                            <div className="w-full mt-3 sm:mt-4">
                              <div className="space-y-2 sm:space-y-3">
                                <span className="block text-amber-800 font-semibold mb-2 sm:mb-3 text-xs sm:text-base">
                                  Choose:
                                </span>
                                {mcqChoices.map((choice, ci) => (
                                  <label key={ci} className={`flex items-start gap-2 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg cursor-pointer transition-all duration-200 border-2 min-h-[52px] ${studentAnswers[i]===choice ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400 shadow-green-500/30 scale-105' : 'bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 border-amber-400/70 hover:border-green-500/70 hover:bg-gradient-to-r hover:from-green-200/50 hover:to-green-100/50 active:scale-95'}`}>
                                    <input 
                                      type="radio" 
                                      name={`q${i}`} 
                                      value={choice} 
                                      checked={studentAnswers[i]===choice} 
                                      onChange={()=>handleAnswer(i,choice)} 
                                      className="accent-green-400 mt-1 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" 
                                      disabled={questionTimers[i]===0} 
                                    />
                                    <span className="font-medium text-xs sm:text-sm md:text-base leading-snug flex-1">{choice}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        } else {
                          // Default fallback for identification/text input questions
                          answerInput = (
                            <div className="w-full mt-3 sm:mt-4">
                              <div className="bg-gradient-to-r from-amber-100 via-orange-100 to-yellow-100 border-2 border-amber-400/70 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg">
                                <label className="block text-amber-800 font-semibold mb-2 sm:mb-3 text-xs sm:text-base">
                                  Answer:
                                </label>
                                <input 
                                  type="text" 
                                  className="w-full bg-amber-50 text-amber-900 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium tracking-wide shadow-inner outline-none border-2 border-amber-300/50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 placeholder-amber-600 transition-all duration-200 text-sm sm:text-base" 
                                  value={studentAnswers[i]||''} 
                                  onChange={e=>handleAnswer(i,e.target.value)} 
                                  placeholder="Type your answer here..." 
                                  disabled={questionTimers[i]===0}
                                  maxLength="200"
                                  title="Case doesn't matter - EDEN, eden, and Eden are all correct"
                                />
                                <div className="flex justify-between items-center mt-2 text-[10px] sm:text-xs text-amber-700">
                                  <span>
                                    {questionTimers[i] === 0 ? 'Time expired' : (
                                      <span className="flex items-center gap-1">
                                        <span className="text-amber-600">💡</span>
                                        <span className="hidden sm:inline">Case insensitive - Capital/lowercase doesn't matter</span>
                                        <span className="sm:hidden">Case insensitive</span>
                                      </span>
                                    )}
                                  </span>
                                  <span>{(studentAnswers[i]||'').length}/200</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return answerInput;
                      })()}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 mt-3 sm:mt-4">
                      <button type="button" className="flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-3 py-2 sm:px-5 sm:py-2 rounded-lg sm:rounded-2xl shadow-lg font-semibold text-xs sm:text-base transition disabled:opacity-50 disabled:cursor-not-allowed" onClick={()=>setCurrentQuestion(q=>Math.max(0,q-1))} disabled={currentQuestion===0}>
                        <FaArrowLeft className="text-white text-xs sm:text-sm" /> Previous
                      </button>
                      <button type="button" className="flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 py-2 sm:px-5 sm:py-2 rounded-lg sm:rounded-2xl shadow-lg font-semibold text-xs sm:text-base transition disabled:opacity-50 disabled:cursor-not-allowed" onClick={()=>setCurrentQuestion(q=>Math.min(qz.questions.length-1,q+1))} disabled={currentQuestion===qz.questions.length-1}>
                        Next <FaArrowRight className="text-white text-xs sm:text-sm" />
                      </button>
                    </div>
                    <div className="flex justify-center sm:justify-end mt-4 sm:mt-6">
                      <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white px-6 sm:px-8 py-3 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg font-bold text-base sm:text-lg transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={Object.keys(studentAnswers).length!==qz.questions.length}>
                        <FaSave className="text-white text-base sm:text-lg" /> Submit Quiz
                      </button>
                    </div>
                  </div>
                )}
                </form>
              </div>
            )}
            {/* Show score if submitted for this quiz */}
            {activeQuizId === qz._id && showScore && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-300 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 shadow-md">
                <FaEye className="text-green-600 text-base sm:text-lg" />
                <span className="font-bold text-sm sm:text-base md:text-lg text-green-800">Your Score: {score} / {qz.questions ? qz.questions.length : '?'}</span>
              </div>
            )}
          </div>
        );
      })
      )}
    </div>
  );

  // Only show create button if user is a teacher
  const isTeacher = user && user.role === 'teacher';
  return (
    <>
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-2xl shadow-2xl p-3 sm:p-8 border-2 sm:border-4 border-blue-400 w-full max-w-sm sm:max-w-md flex flex-col items-center">
            {(() => {
              const quiz = quizzes.find(qz => qz._id === pendingQuizId);
              const alreadyTaken = quiz && Array.isArray(quiz.submissions) && quiz.submissions.some(sub => sub.studentId === studentId);
              if (alreadyTaken) {
                return (
                  <>
                    <h2 className="text-sm sm:text-2xl font-bold text-red-600 mb-2 sm:mb-4">Quiz Already Taken</h2>
                    <p className="text-blue-700 mb-2 sm:mb-4 text-center text-xs sm:text-base">You have already submitted this quiz. Retaking is not allowed.</p>
                    <button
                      className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700 text-white px-3 py-1 sm:px-6 sm:py-2 rounded-lg sm:rounded-2xl shadow-lg font-bold text-xs sm:text-lg transition"
                      onClick={() => setShowStartModal(false)}
                    >
                      <FaTimesCircle className="text-white text-xs sm:text-base" /> Close
                    </button>
                  </>
                );
              }
              return (
                <>
                  <h2 className="text-sm sm:text-2xl font-bold text-blue-900 mb-2 sm:mb-4 text-center">Ready to take the quiz?</h2>
                  <p className="text-blue-700 mb-4 sm:mb-6 text-center text-xs sm:text-base">Click <span className="font-bold text-green-600">Start</span> to begin the quiz or <span className="font-bold text-gray-600">Cancel</span> to go back.</p>
                  <div className="flex gap-2 sm:gap-4 flex-col sm:flex-row w-full sm:w-auto">
                    <button
                      className="flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1 sm:px-6 sm:py-2 rounded-lg sm:rounded-2xl shadow-lg font-bold text-xs sm:text-lg transition"
                      onClick={() => {
                        setActiveQuizId(pendingQuizId);
                        setShowScore(false);
                        setStudentAnswers({});
                        setShowStartModal(false);
                      }}
                    >
                      <FaCheckCircle className="text-white text-xs sm:text-base" /> Start
                    </button>
                    <button
                      className="flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700 text-white px-3 py-1 sm:px-6 sm:py-2 rounded-lg sm:rounded-2xl shadow-lg font-bold text-xs sm:text-lg transition"
                      onClick={() => setShowStartModal(false)}
                    >
                      <FaTimesCircle className="text-white text-xs sm:text-base" /> Cancel
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      <div className={`min-h-full bg-white p-2 sm:p-4 md:p-8 transition-all duration-300 w-full ${isSidebarOpen ? 'md:ml-36 lg:ml-44 md:w-[calc(100%-144px)] lg:w-[calc(100%-176px)]' : 'md:ml-10 lg:ml-12 md:w-[calc(100%-40px)] lg:w-[calc(100%-48px)]'}`}>
        <div className="w-full max-w-none mx-auto flex flex-col justify-center items-center min-h-[80vh] px-1 sm:px-2 md:px-4 lg:px-8">
          <div className="mb-4 sm:mb-6 mt-2 sm:mt-4 ml-2 sm:ml-4 self-start">
          </div>
          <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl p-2 sm:p-3 md:p-6 lg:p-8 xl:p-12 border-l-4 border-blue-400 w-full max-w-none overflow-x-auto">
            <h2 className="text-sm sm:text-lg md:text-2xl font-bold text-blue-900 mb-2 sm:mb-3 md:mb-4 flex items-center gap-1 sm:gap-2">
              <FaListOl className="text-sm sm:text-base md:text-xl" /> <span className="hidden sm:inline">Available Quizzes</span><span className="sm:hidden">Quizzes</span>
            </h2>
            {isTeacher && (
              <div className="flex justify-end mb-4 sm:mb-6">
                <button className="transition bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-3 sm:px-6 py-2 sm:py-3 rounded-2xl shadow-lg text-sm sm:text-lg focus:ring-4 focus:ring-blue-400 flex items-center gap-2" onClick={()=>setShowCreate(!showCreate)}>
                  {showCreate ? (<><FaTimesCircle className="text-white" /> <span className="hidden sm:inline">Cancel</span></>) : (<><FaPlus className="text-white" /> <span className="hidden sm:inline">Create Quiz</span><span className="sm:hidden">Create</span></>)}
                </button>
              </div>
            )}
            {showCreate && (
              <div className="mb-6 sm:mb-8">
                {renderQuizCreation()}
              </div>
            )}
            {renderQuizList()}
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizzHub;
