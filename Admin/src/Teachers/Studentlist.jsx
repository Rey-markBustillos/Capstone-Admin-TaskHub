import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { FaUsers, FaSpinner, FaExclamationTriangle } from 'react-icons/fa'; // Optional: for icons

// Remove the import for StudentList.css as we'll use Tailwind
// import '../Css/StudentList.css'; 

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:5000/api/users?role=student');
        setStudents(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch students.');
        console.error("Failed to fetch students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-center">
          <FaSpinner className="animate-spin text-4xl text-indigo-600 dark:text-indigo-400 mb-4" />
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative text-center" role="alert">
            <FaExclamationTriangle className="inline-block mr-2 text-xl" />
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-1">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center flex items-center justify-center">
          <FaUsers className="mr-3 text-indigo-600 dark:text-indigo-400" /> Student List
        </h1>
        
        {students.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <FaUsers size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No students found.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Email</th>
                    <th className="px-6 py-3 text-left font-semibold">Student ID</th>
                    {/* Add more headers if needed, e.g., Class */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200 font-medium">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{student.studentId || 'N/A'}</td>
                      {/* Add more cells if needed */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;