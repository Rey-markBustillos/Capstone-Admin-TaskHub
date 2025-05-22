import React, { useEffect, useState } from 'react';
import ClipLoader from "react-spinners/ClipLoader";

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

  if (loading)
    return (
      <div className="flex justify-center ml-200 items-center py-20">
        <ClipLoader size={50} color={"#4F46E5"} loading={loading} />
      </div>
    );

  if (error) return <p className="text-red-600 text-center py-6">{error}</p>;

  return (
    <div className="bg-[#FFDAB9] w-430 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 font-sans">
        <h1 className="text-4xl text-gray-900 font-extrabold mb-10 text-center drop-shadow">
          Class Enrollment & Information
        </h1>

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="bg-white border border-indigo-100 rounded-2xl shadow-lg p-7 flex flex-col justify-between hover:shadow-xl transition"
            >
              <div>
                <h2 className="text-2xl font-bold text-gray-600 mb-3">{cls.className}</h2>
                <div className="text-gray-700 text-base space-y-1 mb-5">
                  <p>
                    <span className="font-semibold text-gray-600">Teacher:</span>{" "}
                    <span className="italic">{cls.teacherName}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-600">Room:</span>{" "}
                    {cls.roomNumber}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-600">Schedule:</span>{" "}
                    {new Date(cls.time).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg text-sm mt-2">
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
