import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { FaUsers, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { classId } = useParams(); // Get classId from URL

  useEffect(() => {
    if (!classId) {
      setError("Class ID not found.");
      setLoading(false);
      return;
    }

    const fetchClassStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        // AYOS: Kinukuha ang detalye ng class, kasama ang listahan ng estudyante
 const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";
  const response = await axios.get(`${API_BASE_URL}/class/${classId}`);
        setStudents(response.data.students || []);
        setClassName(response.data.className || '');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch student list.');
        console.error("Failed to fetch students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassStudents();
  }, [classId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center py-8 text-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
        <p className="text-lg text-gray-700">Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center py-8">
        <div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-center text-red-700 shadow-md" role="alert">
          <FaExclamationTriangle className="inline-block mr-2 text-xl" />
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-1">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 py-8 px-2 sm:px-6 lg:px-8">
      {/* Header Section with Icon */}
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <FaUsers className="text-slate-500 text-4xl" />
          <h1 className="break-words text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Student List for <span className="text-slate-600">{className}</span>
          </h1>
        </div>
        <div className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 lg:w-auto">
          {students.length} student{students.length !== 1 ? 's' : ''}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-slate-700 text-center py-10 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <FaUsers size={48} className="text-slate-400 mb-4" />
          <span className="text-lg">No students enrolled in this class.</span>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 p-4 md:hidden">
            {students.map((student) => (
              <article key={student._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-semibold text-slate-900">{student.name}</h2>
                    <p className="mt-1 break-all text-sm text-slate-600">{student.email}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {student.studentId || 'N/A'}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-slate-100 text-slate-700 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Name</th>
                  <th className="px-6 py-3 text-left font-semibold">Email</th>
                  <th className="px-6 py-3 text-left font-semibold">Student ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{student.studentId || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
