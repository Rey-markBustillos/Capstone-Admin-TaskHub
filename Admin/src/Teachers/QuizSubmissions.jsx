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

  if (!quizId) return <div className="text-gray-400">No quiz selected.</div>;
  if (loading) return <div>Loading submissions...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6 text-indigo-900">Quiz Submissions</h2>
      {submissions.length === 0 ? (
        <div className="text-gray-600 bg-indigo-50 rounded-lg p-4 shadow">No submissions yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg bg-gradient-to-br from-indigo-100 to-blue-200 p-1">
          <table className="min-w-full rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-700 to-blue-700">
                <th className="py-3 px-4 text-left text-white font-semibold">Student</th>
                <th className="py-3 px-4 text-left text-white font-semibold">Score</th>
                <th className="py-3 px-4 text-left text-white font-semibold">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => (
                <tr key={s._id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-indigo-50'}>
                  <td className="py-2 px-4 text-indigo-900 font-medium">{s.studentId?.name || s.studentId?.email || 'Unknown'}</td>
                  <td className="py-2 px-4 text-blue-800 font-bold">{s.score}</td>
                  <td className="py-2 px-4 text-gray-700">{new Date(s.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
