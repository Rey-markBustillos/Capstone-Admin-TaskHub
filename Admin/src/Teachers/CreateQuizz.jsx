import React, { useState } from 'react';
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
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editQ, setEditQ] = useState({});

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
      });
      alert('Quiz saved!');
      setQuestions([]); setTitle(''); setModuleText('');
    } catch {
      alert('Failed to save quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="max-w-5xl mx-auto p-0 sm:p-10 bg-[#181a20] rounded-3xl shadow-2xl mt-10 border-4 border-indigo-900 overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-[#23263a]">
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <h2 className="text-3xl font-extrabold text-white flex-1">Quiz Generator</h2>
        <span className="text-indigo-200 text-sm font-medium">Class ID: <span className="font-mono">{classId}</span></span>
      </div>
      <div className="px-8 py-6">
        <h3 className="text-xl font-bold mb-2 text-indigo-200">Module Upload / Paste</h3>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer bg-[#23263a] hover:bg-[#23263a]/80 border border-indigo-900 px-4 py-2 rounded-lg shadow-sm transition">
            <FaUpload className="text-indigo-300" />
            <input type="file" accept=".txt" className="hidden" onChange={handleFileChange} />
            <span className="font-medium text-indigo-200">Upload file</span>
          </label>
          <label className="flex-1 flex items-start gap-2">
            <FaPaste className="mt-2 text-indigo-400" />
            <textarea
              className="border-2 border-indigo-900 bg-[#23263a] text-indigo-100 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-700 placeholder:text-indigo-400"
              rows={5}
              placeholder="Paste module text here..."
              value={moduleText}
              onChange={e => setModuleText(e.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-indigo-200 font-semibold">Number of Questions:</label>
            <input
              type="number"
              min={1}
              max={100}
              className="w-20 border border-indigo-700 rounded bg-[#23263a] text-indigo-100 p-1"
              value={count}
              onChange={e => setCount(Math.max(1, Number(e.target.value)))}
              required
            />
          </div>
        </div>
        <button
          className="bg-gradient-to-r from-indigo-800 to-blue-800 text-white px-6 py-2 rounded-xl font-bold shadow hover:from-indigo-900 hover:to-blue-900 transition mb-8 w-full text-lg disabled:opacity-60"
          onClick={handleGenerate}
          disabled={loading || !moduleText}
        >
          {loading ? 'Generating...' : 'Generate Quiz'}
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
                      <div className="text-sm italic text-indigo-400">Type: {q.type.toUpperCase()}</div>
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

        {questions.length > 0 && (
          <div className="border-t-2 border-indigo-900 pt-6">
            <input
              className="border-2 border-indigo-700 bg-[#23263a] text-indigo-100 rounded-lg p-3 w-full mb-4 text-lg"
              placeholder="Quiz Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <button
              className="bg-gradient-to-r from-green-700 to-green-800 text-white px-6 py-2 rounded-xl font-bold shadow hover:from-green-800 hover:to-green-900 transition w-full text-lg disabled:opacity-60"
              onClick={handleSaveQuiz}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Quiz to Class'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
