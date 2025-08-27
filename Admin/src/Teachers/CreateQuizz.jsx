import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaUpload, FaPaste, FaTrash, FaEdit, FaPlus, FaSave, FaTimes } from 'react-icons/fa';


const API_BASE_URL = 'http://localhost:5000/api';


export default function CreateQuizz() {
  const { classId } = useParams();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user?._id;
  const [moduleText, setModuleText] = useState('');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [createdQuizzes, setCreatedQuizzes] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editQ, setEditQ] = useState({});
  const [quizType, setQuizType] = useState('mixed');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [questionTime, setQuestionTime] = useState(30);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  // const [showSubmissions, setShowSubmissions] = useState(false);
  const bounceRef = useRef();

  // Fetch quizzes created by this teacher for this class
  useEffect(() => {
    const fetchCreatedQuizzes = async () => {
      if (!classId) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/quizzes/class/${classId}`);
        const filtered = res.data.filter(q => q.createdBy === teacherId);
        setCreatedQuizzes(filtered);
        // Set default selected quiz for submissions modal
        if (filtered.length > 0 && !selectedQuizId) {
          setSelectedQuizId(filtered[0]._id);
        }
      } catch {
        setCreatedQuizzes([]);
      }
    };
    fetchCreatedQuizzes();
  }, [classId, teacherId, selectedQuizId]);

  // Handle file upload (doc/pdf to text, MVP: just read text)
  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (f && f.type.startsWith('text/')) {
      const text = await f.text();
      setModuleText(text);
    } else {
      alert('Only text files supported for MVP.');
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
        setQuestions(response.data.questions);
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
      await axios.post(`${API_BASE_URL}/quizzes`, {
        classId,
        title,
        questions,
        createdBy: teacherId,
        dueDate,
        questionTime,
      });
      alert('Quiz saved!');
      setQuestions([]); setTitle(''); setModuleText('');
      // Refresh created quizzes list after saving
      try {
        const res = await axios.get(`${API_BASE_URL}/quizzes/class/${classId}`);
        setCreatedQuizzes(res.data.filter(q => q.createdBy === teacherId));
  } catch { /* ignore error */ }
    } catch {
      alert('Failed to save quiz.');
    } finally {
      setLoading(false);
    }
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
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#181a20] via-[#23263a] to-[#1e2746] py-10">
    <div className="w-full max-w-5xl p-0 sm:p-10 bg-gradient-to-br from-[#181a20] via-[#23263a] to-[#1e2746] rounded-3xl shadow-2xl border-4 border-indigo-900 overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-[#23263a] relative">
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-4 border-b-4 border-indigo-800 shadow-lg justify-center">
        <h2 className="text-3xl font-extrabold text-white drop-shadow-lg tracking-wide flex items-center gap-3 justify-center">
          <svg className="w-10 h-10 text-green-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v1.5m9 0v1.5m0-1.5h-9m9 0a2.25 2.25 0 012.25 2.25v8.25A2.25 2.25 0 0116.5 20.25h-9A2.25 2.25 0 015.25 18V9a2.25 2.25 0 012.25-2.25h9z" /></svg>
          Quiz Generator
        </h2>
      </div>
      <div className="px-8 py-6">
        <h3 className="text-xl font-bold mb-2 text-indigo-200 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Module Upload / Paste
        </h3>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer bg-[#23263a] hover:bg-[#23263a]/80 border-2 border-indigo-900 px-4 py-2 rounded-lg shadow-md transition group">
            <FaUpload className="text-indigo-300 group-hover:text-green-400 transition" />
            <input type="file" accept=".txt" className="hidden" onChange={handleFileChange} />
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
              {questions.map((q, idx) => (
                <div key={idx} className="border-2 border-indigo-900 rounded-xl bg-[#23263a] p-4 shadow flex flex-col gap-2 relative">
                  {editingIdx === idx ? (
                    <>
                      <input
                        className="border-2 border-indigo-700 bg-[#23263a] text-indigo-100 rounded p-2 mb-2 w-full text-lg"
                        value={editQ.question}
                        onChange={e => handleEditChange('question', e.target.value)}
                      />
                      {q.type === 'mcq' && (
                        <textarea
                          className="border-2 border-indigo-900 bg-[#23263a] text-indigo-100 rounded p-2 mb-2 w-full"
                          value={editQ.options?.join('\n')}
                          onChange={e => handleEditChange('options', e.target.value.split('\n'))}
                          placeholder="Options (one per line)"
                        />
                      )}
                      <input
                        className="border-2 border-indigo-900 bg-[#23263a] text-indigo-100 rounded p-2 mb-2 w-full"
                        value={editQ.answer}
                        onChange={e => handleEditChange('answer', e.target.value)}
                        placeholder="Answer"
                      />
                      <div className="flex gap-2 mt-2">
                        <button className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded shadow" onClick={handleSaveEdit}><FaSave /></button>
                        <button className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded shadow" onClick={() => setEditingIdx(null)}><FaTimes /></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold text-lg text-indigo-100">{q.question}</div>
                      <div className="text-sm italic text-indigo-400">Type: {q.displayType || q.type.toUpperCase()}</div>
                      {q.type === 'mcq' && (
                        <ul className="list-disc ml-6 text-indigo-200">
                          {q.options.map((opt, i) => <li key={i}>{opt}</li>)}
                        </ul>
                      )}
                      <div className="text-sm">Answer: <span className="font-bold text-indigo-300">{q.answer.toString()}</span></div>
                      <div className="flex gap-2 mt-2">
                        <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded shadow" onClick={() => handleEdit(idx)}><FaEdit /></button>
                        <button className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded shadow" onClick={() => handleDelete(idx)}><FaTrash /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
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
        {/* Created Quizzes Section */}
        {questions.length === 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-indigo-200">Your Quizzes</h2>
            <div className="bg-[#23263a] rounded-lg p-4 shadow-md">
              <p className="text-indigo-300">No quizzes created yet. Generate a quiz using the module text.</p>
            </div>
          </div>
        )}
        {questions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-indigo-200">Created Quizzes</h2>
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Title</th>
                  <th className="py-2 px-4 border-b">Due Date</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((quiz) => (
                  <tr key={quiz._id}>
                    <td className="py-2 px-4 border-b">{quiz.title}</td>
                    <td className="py-2 px-4 border-b">{quiz.dueDate ? new Date(quiz.dueDate).toLocaleString() : 'N/A'}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        className={`bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 mr-2 ${selectedQuizId === quiz._id ? 'ring-2 ring-blue-400' : ''}`}
                        onClick={() => setSelectedQuizId(quiz._id)}
                      >
                        View Submissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    {/* Save Quiz Button and Created Quizzes Dropdown at the top */}
    <div className="flex justify-end items-center mb-4 gap-4">
      <button
        className="bg-blue-700 text-white px-6 py-2 rounded-xl font-bold shadow hover:bg-blue-800 transition"
        onClick={() => setShowCreatedQuizzes(true)}
        disabled={loading}
      >
        Created Quizzes
      </button>
      <button
        className="bg-gradient-to-r from-green-700 to-green-800 text-white px-6 py-2 rounded-xl font-bold shadow hover:from-green-800 hover:to-green-900 transition disabled:opacity-60"
        onClick={() => setShowSaveModal(true)}
        disabled={loading}
      >
        Save Quiz
      </button>
    </div>

    {/* Created Quizzes Modal */}
    {showCreatedQuizzes && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-2xl border-4 border-indigo-900 relative">
          <button
            className="absolute top-4 right-4 text-indigo-700 hover:text-red-600 text-2xl font-bold focus:outline-none"
            onClick={() => setShowCreatedQuizzes(false)}
          >
            ×
          </button>
          <h2 className="text-2xl font-bold mb-4 text-indigo-900">Created Quizzes</h2>
          {createdQuizzes.length === 0 ? (
            <div className="text-indigo-400">No quizzes created yet.</div>
          ) : (
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Title</th>
                  <th className="py-2 px-4 border-b">Due Date</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {createdQuizzes.map((quiz) => (
                  <tr key={quiz._id}>
                    <td className="py-2 px-4 border-b">{quiz.title}</td>
                    <td className="py-2 px-4 border-b">{quiz.dueDate ? new Date(quiz.dueDate).toLocaleString() : 'N/A'}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 mr-2"
                        onClick={() => { setSelectedQuizId(quiz._id); }}
                      >
                        View Submissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )}
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
