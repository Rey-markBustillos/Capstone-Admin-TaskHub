import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export default function QuizSubmissions({ quizId }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    axios.get(`${API_BASE_URL}/quizzes/${quizId}/submissions`)
      .then(res => setSubmissions(res.data))
      .catch(() => setError('Failed to fetch submissions.'))
      .finally(() => setLoading(false));
  }, [quizId]);

  if (!quizId) return <div className="text-indigo-400">No quiz selected.</div>;
  if (loading) return <div className="text-indigo-200">Loading submissions...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6 text-indigo-100">Quiz Submissions</h2>
      {submissions.length === 0 ? (
        <div className="text-indigo-300 bg-[#23263a] rounded-lg p-4 shadow border border-indigo-800">No submissions yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg bg-gradient-to-br from-[#181a20] via-[#23263a] to-[#1e2746] p-1 border-2 border-indigo-900">
          <table className="min-w-full rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-900 to-blue-900">
                <th className="py-3 px-4 text-left text-indigo-100 font-semibold">Student</th>
                <th className="py-3 px-4 text-left text-indigo-100 font-semibold">Score</th>
                <th className="py-3 px-4 text-left text-indigo-100 font-semibold">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => (
                <tr key={s._id || i} className={i % 2 === 0 ? 'bg-[#23263a]' : 'bg-[#181a20]'}>
                  <td className="py-2 px-4 text-indigo-200 font-medium">{s.studentId?.name || s.studentId?.email || 'Unknown'}</td>
                  <td className="py-2 px-4 text-green-400 font-bold">{s.score}</td>
                  <td className="py-2 px-4 text-indigo-300">{new Date(s.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
