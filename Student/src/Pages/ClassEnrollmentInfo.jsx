import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5000'; // Change if needed

export default function ClassEnrollmentInfo() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/classes`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch class data');
        return res.json();
      })
      .then(data => {
        setClasses(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center py-6">Loading classes...</p>;
  if (error) return <p className="text-red-600 text-center py-6">{error}</p>;

  return (
    <div className="bg-[#FFDAB9] w-450 h-190">
    <div className="p-8 w-400 ml-10 mx-auto font-sans">
      <h1 className="text-4xl text-gray-700 font-bold mb-8 text-center">Class Enrollment & Information</h1>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {classes.map((cls) => (
          <div key={cls._id} className="bg-white border border-gray-200 rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-2">{cls.className}</h2>

            <div className="text-gray-700 text-sm space-y-1 mb-4">
              <p><span className="font-medium">Teacher:</span> {cls.teacherName}</p>
              <p><span className="font-medium">Room Number:</span> {cls.roomNumber}</p>
              <p><span className="font-medium">Schedule:</span> {new Date(cls.time).toLocaleString()}</p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg text-sm">
              <p className="font-semibold text-indigo-700 mb-1">Teacher's Announcement:</p>
              <p className="text-gray-600 italic">
                {/* Replace with real announcement field if available */}
                No announcement available.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
