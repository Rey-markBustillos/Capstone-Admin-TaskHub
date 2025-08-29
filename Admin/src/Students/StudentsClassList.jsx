import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, NavLink } from 'react-router-dom';
import { FaArrowLeft, FaUserGraduate } from 'react-icons/fa';

const API_BASE_URL = "https://capstone-admin-taskhub-2.onrender.com/api";

const StudentClassList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { classId } = useParams();

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
    return <div className="text-center p-10">Loading class list...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 mt-4 ml-4">
        <NavLink
          to={`/student/class/${classId}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-700 text-white font-semibold shadow hover:bg-indigo-800 transition mb-4"
        >
          <FaArrowLeft /> Back to Class Menu
        </NavLink>
      </div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Class List</h1>
      {students.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {students.map((student) => (
              <li key={student._id} className="p-4 flex items-center">
                <FaUserGraduate className="text-gray-500 mr-4" size={24} />
                <span className="text-gray-800 dark:text-gray-200 font-medium">{student.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-gray-600 dark:text-gray-400">No students found in this class.</p>
        </div>
      )}
    </div>
  );
};

export default StudentClassList;