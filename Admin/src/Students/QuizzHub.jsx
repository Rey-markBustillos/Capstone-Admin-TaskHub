import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaListOl, FaPlus, FaEye, FaArrowLeft, FaArrowRight, FaPen, FaSave } from 'react-icons/fa';
import { useParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';


const QuizzHub = () => {
  // Popup state for quiz start
  const [showStartModal, setShowStartModal] = useState(false);
  const [pendingQuizId, setPendingQuizId] = useState(null);
  const [startInput, setStartInput] = useState('');
  const { classId } = useParams();
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
  const QUESTION_TIME = 30; // seconds per question (change as needed)
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
        setQuestionTimers(Array(quiz.questions.length).fill(QUESTION_TIME));
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
  <div className="mb-8 p-4 bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-lg w-full max-w-none">
  <h2 className="text-lg font-bold mb-2 text-gray-100">Create New Quiz</h2>
      <form onSubmit={handleCreateQuiz}>
        <input className="input mb-2" type="text" placeholder="Title" value={newQuiz.title} onChange={e=>setNewQuiz({ ...newQuiz, title: e.target.value })} required />
        <textarea className="input mb-2" placeholder="Description" value={newQuiz.description} onChange={e=>setNewQuiz({ ...newQuiz, description: e.target.value })} required />
        <input className="input mb-2" type="date" value={newQuiz.dueDate} onChange={e=>setNewQuiz({ ...newQuiz, dueDate: e.target.value })} required />
        {/* For simplicity, only allow one question for now */}
        <input className="input mb-2" type="text" placeholder="Question" value={newQuiz.questions[0]?.question || ''} onChange={e=>setNewQuiz({ ...newQuiz, questions: [{ ...newQuiz.questions[0], question: e.target.value, type: 'multiple', choices: [], answer: '' }] })} required />
        <input className="input mb-2" type="text" placeholder="Choices (comma separated)" value={newQuiz.questions[0]?.choices?.join(',') || ''} onChange={e=>setNewQuiz({ ...newQuiz, questions: [{ ...newQuiz.questions[0], choices: e.target.value.split(','), type: 'multiple', answer: newQuiz.questions[0]?.answer || '' }] })} required />
        <input className="input mb-2" type="text" placeholder="Correct Answer" value={newQuiz.questions[0]?.answer || ''} onChange={e=>setNewQuiz({ ...newQuiz, questions: [{ ...newQuiz.questions[0], answer: e.target.value, type: 'multiple', choices: newQuiz.questions[0]?.choices || [] }] })} required />
  <button type="submit" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-900 text-gray-100 font-bold px-6 py-2 rounded-2xl shadow-lg text-base transition"><FaPlus className="text-gray-100" /> Create Quiz</button>
  {createError && <div className="text-red-400 mt-2">{createError}</div>}
  {createSuccess && <div className="text-green-300 mt-2">{createSuccess}</div>}
      </form>
    </div>
  );

  // Render quiz list and take quiz
  const renderQuizList = () => (
    <div>
  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-100"><FaListOl /> Available Quizzes</h2>
      {loading && <div>Loading quizzes...</div>}
  {error && <div className="text-red-400">{error}</div>}
      {quizzes.length === 0 && !loading ? (
        <div>No quizzes available.</div>
      ) : (
        quizzes.map((qz, idx) => {
          // Check if student has already taken this quiz
          const alreadyTaken = Array.isArray(qz.submissions) && qz.submissions.some(sub => sub.studentId === studentId);
          return (
            <div key={qz._id || idx} className="mb-6 p-4 bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-lg w-full max-w-none">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <div>
                  <div className="font-bold text-lg text-gray-100">{qz.title}</div>
                  <div className="text-gray-200 text-sm mb-1">{qz.description}</div>
                  <div className="text-xs text-gray-300 flex items-center gap-1"><FaCalendarAlt /> Due: {qz.dueDate ? new Date(qz.dueDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                {alreadyTaken ? (
                  <div className="flex flex-col items-start">
                    <button
                      className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-700 text-gray-300 px-5 py-2 rounded-2xl shadow-lg font-bold text-base transition mt-2 md:mt-0 opacity-60 cursor-not-allowed"
                      disabled
                      title="You have already taken this quiz."
                    >
                      <FaPen className="text-gray-300" /> Quiz Taken
                    </button>
                    {/* Show score below button */}
                    {Array.isArray(qz.submissions) && qz.submissions.filter(sub => sub.studentId === studentId).map((sub, i) => (
                      <div
                        key={i}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-700 via-green-600 to-green-500 shadow-lg border-2 border-green-300/60 animate-fade-in-up"
                        style={{ minWidth: '160px' }}
                      >
                        <FaCheckCircle className="text-yellow-300 text-xl drop-shadow" />
                        <span className="font-bold text-white text-base tracking-wide">Your Score:</span>
                        <span className="ml-2 text-2xl font-extrabold text-yellow-200 drop-shadow-lg">{typeof sub.score === 'number' ? sub.score : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-gray-100 px-5 py-2 rounded-2xl shadow-lg font-bold text-base transition mt-2 md:mt-0"
                    onClick={() => {
                      setPendingQuizId(qz._id);
                      setShowStartModal(true);
                      setStartInput('');
                    }}
                    title="Take Quiz"
                  >
                    <FaPen className="text-gray-100" /> Take Quiz
                  </button>
                )}
              </div>
            {/* Render questions if this quiz is active and not showing score */}
            {activeQuizId === qz._id && !showScore && (
              <form onSubmit={e=>{e.preventDefault();submitQuiz(qz._id);}}>
                {qz.questions && qz.questions.length > 0 && (
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg text-gray-100 drop-shadow mb-2" style={{textShadow:'0 1px 4px #23263a'}}>
                          {currentQuestion+1}. {qz.questions[currentQuestion].question}
                        </span>
                        <span className="text-red-300 font-bold text-lg bg-[#23263a] px-3 py-1 rounded-lg shadow">Time left: {questionTimers[currentQuestion]}s</span>
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
                        const letterChoices = [
                          'A. ', 'B. ', 'C. ', 'D. ', 'A.', 'B.', 'C.', 'D.'
                        ];
                        let detectedMCQ = false;
                        let mcqChoices = null;
                        if(type==='mcq' && (q.options || q.choices)) {
                          detectedMCQ = true;
                          mcqChoices = q.options || q.choices;
                        } else if(Array.isArray(q.choices) && q.choices.length > 0) {
                          detectedMCQ = true;
                          mcqChoices = q.choices;
                        } else if(typeof q.question === 'string' && letterChoices.some(lc => q.question.includes(lc))) {
                          // Try to extract choices from question text
                          const match = q.question.match(/A\.[^A-D]*B\.[^A-D]*C\.[^A-D]*D\.[^A-D]*/);
                          if(match) {
                            // crude split
                            const parts = match[0].split(/([A-D]\. )/).filter(Boolean);
                            mcqChoices = parts.filter((p, idx) => idx % 2 === 1).map((l, idx) => l + parts[idx*2+1]);
                            detectedMCQ = true;
                          }
                        }
                        if(type==='true_false') {
                          answerInput = (
                            <div className="flex flex-col gap-2 mt-2">
                              <span className="font-semibold text-green-200 mb-1">True or False:</span>
                              <div className="flex gap-4">
                                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md cursor-pointer transition-all border-2 ${studentAnswers[i]==='True' ? 'bg-green-600 text-gray-100 border-green-400' : 'bg-[#181a20] text-green-100 border-green-700'}` }>
                                  <input type="radio" name={`q${i}`} value="True" checked={studentAnswers[i]==='True'} onChange={()=>handleAnswer(i,'True')} className="accent-green-400" disabled={questionTimers[i]===0} />
                                  <span className="font-bold">True</span>
                                </label>
                                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md cursor-pointer transition-all border-2 ${studentAnswers[i]==='False' ? 'bg-red-600 text-gray-100 border-red-400' : 'bg-[#181a20] text-red-100 border-red-700'}` }>
                                  <input type="radio" name={`q${i}`} value="False" checked={studentAnswers[i]==='False'} onChange={()=>handleAnswer(i,'False')} className="accent-red-400" disabled={questionTimers[i]===0} />
                                  <span className="font-bold">False</span>
                                </label>
                              </div>
                            </div>
                          );
                        } else if(type==='identification' || (!detectedMCQ && !['mcq','true_false'].includes(type))) {
                          answerInput = (
                            <div className="flex items-center gap-2 bg-[#181a20] border-2 border-green-700 rounded-lg px-4 py-2 shadow-md w-fit mt-2">
                              <span className="font-semibold text-green-200 mr-2">Your Answer:</span>
                              <input type="text" className="bg-[#23263a] text-gray-100 px-3 py-1 rounded-lg font-bold tracking-wide shadow outline-none border-none placeholder-gray-300" value={studentAnswers[i]||''} onChange={e=>handleAnswer(i,e.target.value)} placeholder="Type your answer here..." style={{minWidth:'120px'}} disabled={questionTimers[i]===0} />
                            </div>
                          );
                        } else if(detectedMCQ && mcqChoices) {
                          answerInput = (
                            <div className="flex flex-col gap-1 mt-2">
                              {mcqChoices.map((choice, ci) => (
                                <label key={ci} className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md cursor-pointer transition-all bg-[#23263a] text-green-100 hover:bg-green-700 hover:text-gray-100">
                                  <input type="radio" name={`q${i}`} value={choice} checked={studentAnswers[i]===choice} onChange={()=>handleAnswer(i,choice)} className="accent-green-400" disabled={questionTimers[i]===0} />
                                  <span className="font-semibold">{choice}</span>
                                </label>
                              ))}
                            </div>
                          );
                        }
                        return answerInput;
                      })()}
                    </div>
                    <div className="flex justify-between mt-4">
                      <button type="button" className="flex items-center gap-2 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-gray-900 text-gray-100 px-5 py-2 rounded-2xl shadow-lg font-semibold text-base transition disabled:opacity-50" onClick={()=>setCurrentQuestion(q=>Math.max(0,q-1))} disabled={currentQuestion===0}>
                        <FaArrowLeft className="text-gray-100" /> Previous
                      </button>
                      <button type="button" className="flex items-center gap-2 bg-gradient-to-r from-green-700 to-green-900 hover:from-green-800 hover:to-green-900 text-gray-100 px-5 py-2 rounded-2xl shadow-lg font-semibold text-base transition disabled:opacity-50" onClick={()=>setCurrentQuestion(q=>Math.min(qz.questions.length-1,q+1))} disabled={currentQuestion===qz.questions.length-1}>
                        Next <FaArrowRight className="text-gray-100" />
                      </button>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button type="submit" className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-gray-100 px-6 py-2 rounded-2xl shadow-lg font-bold text-lg transition disabled:opacity-50" disabled={Object.keys(studentAnswers).length!==qz.questions.length}>
                        <FaSave className="text-gray-100" /> Submit Quiz
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
            {/* Show score if submitted for this quiz */}
            {activeQuizId === qz._id && showScore && (
              <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center gap-2">
                <FaEye className="text-green-600" />
                <span className="font-bold">Your Score: {score} / {qz.questions ? qz.questions.length : '?'}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-[#23263a] to-[#1a223a] rounded-2xl shadow-2xl p-8 border-4 border-indigo-900/80 w-full max-w-none flex flex-col items-center">
            {(() => {
              const quiz = quizzes.find(qz => qz._id === pendingQuizId);
              const alreadyTaken = quiz && Array.isArray(quiz.submissions) && quiz.submissions.some(sub => sub.studentId === studentId);
              if (alreadyTaken) {
                return (
                  <>
                    <h2 className="text-2xl font-bold text-red-300 mb-4">Quiz Already Taken</h2>
                    <p className="text-gray-200 mb-4 text-center">You have already submitted this quiz. Retaking is not allowed.</p>
                    <button
                      className="flex items-center gap-2 bg-gradient-to-r from-gray-400 to-gray-700 hover:from-gray-500 hover:to-gray-800 text-gray-100 px-6 py-2 rounded-2xl shadow-lg font-bold text-lg transition"
                      onClick={() => setShowStartModal(false)}
                    >
                      <FaTimesCircle className="text-gray-100" /> Close
                    </button>
                  </>
                );
              }
              return (
                <>
                  <h2 className="text-2xl font-bold text-gray-100 mb-4">Are you ready to take the quiz?</h2>
                  <p className="text-gray-200 mb-4 text-center">Type <span className="font-bold text-green-300">start</span> below and press Enter or click Start to begin.</p>
                  <input
                    className="w-full px-4 py-2 rounded-lg border-2 border-green-400 bg-[#181a20] text-gray-100 text-lg mb-4 focus:ring-2 focus:ring-green-300 outline-none placeholder-gray-300"
                    placeholder="Type 'start' to begin..."
                    value={startInput}
                    onChange={e => setStartInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && startInput.trim().toLowerCase() === 'start') {
                        setActiveQuizId(pendingQuizId);
                        setShowScore(false);
                        setStudentAnswers({});
                        setShowStartModal(false);
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-4">
                    <button
                      className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-gray-100 px-6 py-2 rounded-2xl shadow-lg font-bold text-lg transition disabled:opacity-50"
                      disabled={startInput.trim().toLowerCase() !== 'start'}
                      onClick={() => {
                        setActiveQuizId(pendingQuizId);
                        setShowScore(false);
                        setStudentAnswers({});
                        setShowStartModal(false);
                      }}
                    >
                      <FaCheckCircle className="text-gray-100" /> Start
                    </button>
                    <button
                      className="flex items-center gap-2 bg-gradient-to-r from-gray-400 to-gray-700 hover:from-gray-500 hover:to-gray-800 text-gray-100 px-6 py-2 rounded-2xl shadow-lg font-bold text-lg transition"
                      onClick={() => setShowStartModal(false)}
                    >
                      <FaTimesCircle className="text-gray-100" /> Cancel
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-[#1a223a] via-[#23263a] to-[#1e2746] p-4 sm:p-8 flex flex-col items-center">
  <div className="w-full max-w-none mx-auto">
          {isTeacher && (
            <div className="flex justify-end mb-6">
              <button className="transition bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold px-6 py-3 rounded-2xl shadow-lg text-lg focus:ring-4 focus:ring-blue-400 flex items-center gap-2" onClick={()=>setShowCreate(!showCreate)}>
                {showCreate ? (<><FaTimesCircle className="text-white" /> Cancel</>) : (<><FaPlus className="text-white" /> Create Quiz</>)}
              </button>
            </div>
          )}
          {showCreate && (
            <div className="mb-8">
              {renderQuizCreation()}
            </div>
          )}
          <div className="rounded-3xl shadow-2xl bg-gradient-to-br from-[#23263a] via-[#1a223a] to-[#23263a] p-8 border-4 border-indigo-900/60">
            {renderQuizList()}
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizzHub;
