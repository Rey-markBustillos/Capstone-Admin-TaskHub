import React, { useState, useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import axios from 'axios';
import StudentClassNavbar from '../components/StudentClassNavbar'; // Corrected path

const API_BASE_URL = 'http://localhost:5000/api';

const StudentClassView = () => {
  const { classId } = useParams();
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/class/${classId}`);
        setSelectedClass(res.data);
      } catch {
        setError('Failed to fetch class details.');
      } finally {
        setLoading(false);
      }
    };
    fetchClassDetails();
  }, [classId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading class details...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  return (
    <div>
      <StudentClassNavbar selectedClass={selectedClass} />
      <main className="p-4 md:p-8">
        {/* Dito mare-render ang nested routes tulad ng Announcements, Activities, etc. */}
        <Outlet />
      </main>
    </div>
  );
};

export default StudentClassView;