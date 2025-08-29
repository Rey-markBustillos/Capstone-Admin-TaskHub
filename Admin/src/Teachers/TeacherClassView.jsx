import React, { useState, useEffect } from 'react';
import { useParams, Outlet, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar'; // Siguraduhing tama ang path
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const API_BASE_URL = "https://capstone-admin-taskhub-2.onrender.com/api";

const TeacherClassView = () => {
  const { classId } = useParams();
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!classId) {
      setLoading(false);
      setError("No Class ID provided.");
      return;
    }

    const fetchClassDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Tiyaking mayroon kang API endpoint para kumuha ng isang klase gamit ang ID
  const res = await axios.get(`${API_BASE_URL}/class/${classId}`);
        setSelectedClass(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load class details.");
        console.error("Error fetching class details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [classId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <FaSpinner className="animate-spin text-4xl" />
        <span className="ml-4 text-xl">Loading Class Details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white text-center p-4">
        <FaExclamationTriangle className="text-red-500 text-5xl mb-4" />
        <h2 className="text-2xl font-bold text-red-400">Error Loading Class</h2>
        <p className="text-gray-300 mt-2">{error}</p>
      </div>
    );
  }
  
  if (!selectedClass) {
     return <Navigate to="/classes" replace />; // Bumalik sa class list kung walang data
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar selectedClass={selectedClass} />
      <main className="p-4 md:p-6 lg:p-8">
        {/* Dito lalabas ang content ng Announcements, Create Activity, atbp. */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default TeacherClassView;