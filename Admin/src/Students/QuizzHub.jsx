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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizzes, setQuizzes] = useState([]);

  // Fetch quizzes for this class
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/quiz?classId=${classId}`);
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
      const res = await axios.post(`${API_BASE_URL}/quiz/${quizId}/submit`, {
        studentId,
        answers: studentAnswers,
      });
      setScore(res.data.score);
      setScore(res.data.score);
      setShowScore(true);
    } catch {
      setError('Failed to submit quiz.');
    } finally {
      setLoading(false);
    }
  };

  // Render quiz creation (for demo, not for students)
  // const renderQuizCreation = () => (
  //   <div className="mb-8 p-4 bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-lg">
  //     ... (removed unused function)
  //   </div>
  // );

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
              <button className="btn bg-indigo-600 text-white mt-2 md:mt-0" onClick={()=>setShowScore(false)}>Take Quiz</button>
            </div>
            {/* Render questions if taking quiz */}
            {!showScore && (
              <form onSubmit={e=>{e.preventDefault();submitQuiz(qz._id);}}>
                {qz.questions && qz.questions.map((q, i) => (
                  <div key={i} className="mb-4">
                    <div className="font-semibold mb-1">{i+1}. {q.question}</div>
                    {q.type==='multiple' && q.choices && (
                      <div className="flex flex-col gap-1">
                        {q.choices.map((choice, ci) => (
                          <label key={ci} className="flex items-center gap-2">
                            <input type="radio" name={`q${i}`} value={choice} checked={studentAnswers[i]===choice} onChange={()=>handleAnswer(i,choice)} />
                            {choice}
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type==='truefalse' && (
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" name={`q${i}`} value="True" checked={studentAnswers[i]==='True'} onChange={()=>handleAnswer(i,'True')} /> True
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name={`q${i}`} value="False" checked={studentAnswers[i]==='False'} onChange={()=>handleAnswer(i,'False')} /> False
                        </label>
                      </div>
                    )}
                    {q.type==='numeric' && (
                      <input type="number" className="input" value={studentAnswers[i]||''} onChange={e=>handleAnswer(i,e.target.value)} />
                    )}
                  </div>
                ))}
                <button type="submit" className="btn bg-green-600 text-white"><FaCheckCircle /> Submit Quiz</button>
              </form>
            )}
            {/* Show score if submitted */}
            {showScore && (
              <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center gap-2">
                <FaEye className="text-green-600" />
                <span className="font-bold">Your Score: {score} / {qz.questions ? qz.questions.reduce((sum,q)=>sum+q.points,0) : '?'}</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Quiz creation UI (for demo/admin) */}
        {/* {renderQuizCreation()} */}
        {/* Quiz list and take quiz */}
        {renderQuizList()}
      </div>
    </div>
  );
};

export default QuizzHub;
