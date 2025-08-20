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
  const response = await axios.get(`https://capstone-admin-task-hub.vercel.app/api/class/${classId}`);
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
      <div className="flex flex-col items-center justify-center py-8">
        <FaSpinner className="animate-spin text-4xl text-indigo-400 mb-4" />
        <p className="text-lg text-gray-300">Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg text-center" role="alert">
          <FaExclamationTriangle className="inline-block mr-2 text-xl" />
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-1">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-8 text-center flex items-center justify-center">
        <FaUsers className="mr-3 text-indigo-400" /> Student List for {className}
      </h1>
      
      {students.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-gray-800/50 rounded-lg">
          <FaUsers size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No students enrolled in this class.</p>
        </div>
      ) : (
        <div className="bg-gray-800/70 backdrop-blur-sm shadow-xl rounded-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-700/50 text-gray-300 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Name</th>
                  <th className="px-6 py-3 text-left font-semibold">Email</th>
                  <th className="px-6 py-3 text-left font-semibold">Student ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-200 font-medium">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{student.studentId || 'N/A'}</td>
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