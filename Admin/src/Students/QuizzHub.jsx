import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaListOl, FaPlus, FaEye } from 'react-icons/fa';
import { useParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';


const QuizzHub = () => {
  const { classId } = useParams();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user?._id;

  // Quiz info
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizzes, setQuizzes] = useState([]);

  // Fetch quizzes for this class
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
  const res = await axios.get(`${API_BASE_URL}/quizzes/class/${classId}`);
  setQuizzes(res.data || []);
      } catch {
        setError('Failed to fetch quizzes.');
      } finally {
        setLoading(false);
      }
    };
    if (classId) fetchQuizzes();
  }, [classId]);

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
    <div className="mb-8 p-4 bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-lg">
      <h2 className="text-lg font-bold mb-2">Create New Quiz</h2>
      <form onSubmit={handleCreateQuiz}>
        <input className="input mb-2" type="text" placeholder="Title" value={newQuiz.title} onChange={e=>setNewQuiz({ ...newQuiz, title: e.target.value })} required />
        <textarea className="input mb-2" placeholder="Description" value={newQuiz.description} onChange={e=>setNewQuiz({ ...newQuiz, description: e.target.value })} required />
        <input className="input mb-2" type="date" value={newQuiz.dueDate} onChange={e=>setNewQuiz({ ...newQuiz, dueDate: e.target.value })} required />
        {/* For simplicity, only allow one question for now */}
        <input className="input mb-2" type="text" placeholder="Question" value={newQuiz.questions[0]?.question || ''} onChange={e=>setNewQuiz({ ...newQuiz, questions: [{ ...newQuiz.questions[0], question: e.target.value, type: 'multiple', choices: [], answer: '' }] })} required />
        <input className="input mb-2" type="text" placeholder="Choices (comma separated)" value={newQuiz.questions[0]?.choices?.join(',') || ''} onChange={e=>setNewQuiz({ ...newQuiz, questions: [{ ...newQuiz.questions[0], choices: e.target.value.split(','), type: 'multiple', answer: newQuiz.questions[0]?.answer || '' }] })} required />
        <input className="input mb-2" type="text" placeholder="Correct Answer" value={newQuiz.questions[0]?.answer || ''} onChange={e=>setNewQuiz({ ...newQuiz, questions: [{ ...newQuiz.questions[0], answer: e.target.value, type: 'multiple', choices: newQuiz.questions[0]?.choices || [] }] })} required />
        <button type="submit" className="btn bg-blue-600 text-white">Create Quiz</button>
        {createError && <div className="text-red-500 mt-2">{createError}</div>}
        {createSuccess && <div className="text-green-600 mt-2">{createSuccess}</div>}
      </form>
    </div>
  );

  // Render quiz list and take quiz
  const renderQuizList = () => (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaListOl /> Available Quizzes</h2>
      {loading && <div>Loading quizzes...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {quizzes.length === 0 && !loading ? <div>No quizzes available.</div> : (
        quizzes.map((qz, idx) => (
          <div key={qz._id || idx} className="mb-6 p-4 bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <div>
                <div className="font-bold text-lg">{qz.title}</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm mb-1">{qz.description}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1"><FaCalendarAlt /> Due: {qz.dueDate ? new Date(qz.dueDate).toLocaleDateString() : 'N/A'}</div>
              </div>
              <button className="btn bg-indigo-600 text-white mt-2 md:mt-0" onClick={()=>{setActiveQuizId(qz._id); setShowScore(false); setStudentAnswers({});}}>Take Quiz</button>
            </div>
            {/* Render questions if this quiz is active and not showing score */}
            {activeQuizId === qz._id && !showScore && (
              <form onSubmit={e=>{e.preventDefault();submitQuiz(qz._id);}}>
                {qz.questions && qz.questions.map((q, i) => {
                  // Normalize type for rendering
                  let type = q.type;
                  if (type === 'multiple' || type === 'mcq') type = 'mcq';
                  else if (type === 'truefalse' || type === 'true_false') type = 'true_false';
                  else if (type === 'identification' || type === 'numeric') type = 'identification';
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
                  if(detectedMCQ && mcqChoices) {
                    answerInput = (
                      <div className="flex flex-col gap-1 mt-2">
                        {mcqChoices.map((choice, ci) => (
                          <label key={ci} className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md cursor-pointer transition-all bg-[#23263a] text-green-200 hover:bg-green-700 hover:text-white">
                            <input type="radio" name={`q${i}`} value={choice} checked={studentAnswers[i]===choice} onChange={()=>handleAnswer(i,choice)} className="accent-green-400" />
                            <span className="font-semibold">{choice}</span>
                          </label>
                        ))}
                      </div>
                    );
                  } else if(type==='true_false' || (typeof q.question === 'string' && /true|false/i.test(q.question))) {
                    answerInput = (
                      <div className="flex flex-col gap-2 mt-2">
                        <span className="font-semibold text-green-300 mb-1">True or False:</span>
                        <div className="flex gap-4">
                          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md cursor-pointer transition-all border-2 ${studentAnswers[i]==='True' ? 'bg-green-600 text-white border-green-400' : 'bg-[#181a20] text-green-200 border-green-700'}` }>
                            <input type="radio" name={`q${i}`} value="True" checked={studentAnswers[i]==='True'} onChange={()=>handleAnswer(i,'True')} className="accent-green-400" />
                            <span className="font-bold">True</span>
                          </label>
                          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md cursor-pointer transition-all border-2 ${studentAnswers[i]==='False' ? 'bg-red-600 text-white border-red-400' : 'bg-[#181a20] text-red-200 border-red-700'}` }>
                            <input type="radio" name={`q${i}`} value="False" checked={studentAnswers[i]==='False'} onChange={()=>handleAnswer(i,'False')} className="accent-red-400" />
                            <span className="font-bold">False</span>
                          </label>
                        </div>
                      </div>
                    );
                  } else {
                    // Default to identification
                    answerInput = (
                      <div className="flex items-center gap-2 bg-[#181a20] border-2 border-green-700 rounded-lg px-4 py-2 shadow-md w-fit mt-2">
                        <span className="font-semibold text-green-300 mr-2">Your Answer:</span>
                        <input type="text" className="bg-[#23263a] text-white px-3 py-1 rounded-lg font-bold tracking-wide shadow outline-none border-none" value={studentAnswers[i]||''} onChange={e=>handleAnswer(i,e.target.value)} placeholder="Type your answer here..." style={{minWidth:'120px'}} />
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="mb-4">
                      <div className="font-semibold text-lg text-white drop-shadow mb-2" style={{textShadow:'0 1px 4px #23263a'}}>{i+1}. {q.question}</div>
                      {answerInput}
                    </div>
                  );
                })}
                <button type="submit" className="btn bg-green-600 text-white"><FaCheckCircle /> Submit Quiz</button>
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
        ))
      )}
    </div>
  );

  // Only show create button if user is a teacher
  const isTeacher = user && user.role === 'teacher';
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {isTeacher && (
          <>
            <button className="btn bg-blue-700 text-white mb-4" onClick={()=>setShowCreate(!showCreate)}>
              {showCreate ? 'Cancel' : 'Create Quiz'}
            </button>
            {showCreate && renderQuizCreation()}
          </>
        )}
        {renderQuizList()}
      </div>
    </div>
  );
};

export default QuizzHub;
