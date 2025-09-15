import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, NavLink } from 'react-router-dom';
import { FaArrowLeft, FaUserGraduate, FaUsers } from 'react-icons/fa';
import SidebarContext from '../contexts/SidebarContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

const StudentClassList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { classId } = useParams();
  const { isSidebarOpen } = useContext(SidebarContext);

  useEffect(() => {
    if (!classId) return;

    const fetchClassList = async () => {
      setLoading(true);
      try {
        // Assuming the class details endpoint includes the list of students
        const res = await axios.get(`${API_BASE_URL}/class/${classId}`);
        setStudents(res.data.students || []);
      } catch (err) {
        setError('Failed to load class list.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassList();
  }, [classId]);

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-2 sm:p-4 md:p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'ml-10 sm:ml-12 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'}`}>
        <div className="text-center p-6 sm:p-10 text-gray-100">Loading class list...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-2 sm:p-4 md:p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'ml-10 sm:ml-12 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'}`}>
        <div className="text-center p-6 sm:p-10 text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-2 sm:p-4 md:p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'ml-10 sm:ml-12 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'}`}>
      <div className="w-full max-w-none mx-auto flex flex-col justify-center items-center min-h-[80vh] px-1 sm:px-2 md:px-4 lg:px-8">
        <div className="mb-4 sm:mb-6 mt-2 sm:mt-4 ml-2 sm:ml-4 self-start">
          <NavLink
            to={`/student/class/${classId}`}
            className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base rounded-lg bg-indigo-700 text-white font-semibold shadow hover:bg-indigo-800 transition mb-2 sm:mb-4"
          >
            <FaArrowLeft className="text-xs sm:text-sm" /> <span className="hidden xs:inline sm:inline">Back to Class Menu</span><span className="xs:hidden sm:hidden">Back</span>
          </NavLink>
        </div>
        <div className="bg-white/80 dark:bg-gray-900/80 rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 md:p-8 lg:p-12 xl:p-16 border-4 sm:border-8 border-indigo-600 dark:border-indigo-800 backdrop-blur-md w-full max-w-none overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <FaUsers className="text-indigo-600 dark:text-indigo-400 text-lg sm:text-2xl" />
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-indigo-700 dark:text-indigo-300">Class List</h1>
          </div>
          {students.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {students.map((student, index) => (
                  <li key={student._id} className="p-3 sm:p-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mr-3 sm:mr-4">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm sm:text-base">{index + 1}</span>
                    </div>
                    <FaUserGraduate className="text-indigo-500 mr-2 sm:mr-3 text-sm sm:text-lg" />
                    <span className="text-gray-800 dark:text-gray-200 font-medium text-sm sm:text-base">{student.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center p-6 sm:p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <FaUserGraduate className="mx-auto mb-4 text-indigo-400 dark:text-indigo-500" size={36} />
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">No students found in this class.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentClassList;