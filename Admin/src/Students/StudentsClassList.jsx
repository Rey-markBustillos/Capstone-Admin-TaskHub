import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { FaUserGraduate, FaUsers } from 'react-icons/fa';
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
      <div className={`min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 md:p-8 transition-all duration-300 pt-28 sm:pt-32 md:pt-36 w-full ${isSidebarOpen ? 'md:ml-36 lg:ml-44 md:w-[calc(100%-144px)] lg:w-[calc(100%-176px)]' : 'md:ml-10 lg:ml-12 md:w-[calc(100%-40px)] lg:w-[calc(100%-48px)]'}`}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-10 text-lg font-semibold text-gray-800">Loading class list...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 md:p-8 transition-all duration-300 pt-28 sm:pt-32 md:pt-36 w-full ${isSidebarOpen ? 'md:ml-36 lg:ml-44 md:w-[calc(100%-144px)] lg:w-[calc(100%-176px)]' : 'md:ml-10 lg:ml-12 md:w-[calc(100%-40px)] lg:w-[calc(100%-48px)]'}`}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-10 text-red-500 bg-white rounded-xl shadow-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 md:p-8 transition-all duration-300 pt-28 sm:pt-32 md:pt-36 w-full ${isSidebarOpen ? 'md:ml-36 lg:ml-44 md:w-[calc(100%-144px)] lg:w-[calc(100%-176px)]' : 'md:ml-10 lg:ml-12 md:w-[calc(100%-40px)] lg:w-[calc(100%-48px)]'}`}>
      <div className="w-full">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <FaUsers className="text-blue-600 text-2xl sm:text-3xl" />
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">Class List</h1>
          </div>
          {students.length > 0 ? (
            <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
              <ul className="divide-y divide-blue-200">
                {students.map((student, index) => (
                  <li key={student._id} className="p-4 sm:p-5 flex items-center hover:bg-blue-100 transition-colors">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 text-white rounded-full mr-4">
                      <span className="font-bold text-base sm:text-lg">{index + 1}</span>
                    </div>
                    <FaUserGraduate className="text-blue-600 mr-3 text-xl sm:text-2xl flex-shrink-0" />
                    <span className="text-gray-800 font-semibold text-base sm:text-lg">{student.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center p-10 sm:p-12 bg-blue-50 rounded-lg border-2 border-blue-200">
              <FaUserGraduate className="mx-auto mb-4 text-blue-400" size={48} />
              <p className="text-gray-600 text-base sm:text-lg font-medium">No students found in this class.</p>
            </div>
          )}
          {students.length > 0 && (
            <div className="mt-6 pt-4 border-t border-blue-200">
              <p className="text-gray-700 font-medium">
                Total Students: <span className="text-blue-600 font-bold text-lg">{students.length}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentClassList;