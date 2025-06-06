import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../Css/teacherannouncement.css'
import { FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';

const API_BASE = 'http://localhost:5000/api/announcements';

export default function TeacherAnnouncement() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?._id;

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    id: null,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnnouncements = async () => {
    if (!userId) {
      setError("User not identified. Cannot fetch announcements.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}?postedBy=${userId}`);
      setAnnouncements(res.data);
      setError(null); 
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); 

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      const payload = {
        title: form.title,
        content: form.content,
        postedBy: userId, 
      };
      if (form.id) {
        await axios.put(`${API_BASE}/${form.id}`, payload);
      } else {
        await axios.post(API_BASE, payload);
      }
      setForm({ title: '', content: '', id: null });
      fetchAnnouncements();
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleEdit = (ann) => {
    setForm({ title: ann.title, content: ann.content, id: ann._id });
    setError(null); 
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const openModalForCreate = () => {
    setForm({ title: '', content: '', id: null }); 
    setError(null); 
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
            My Announcements
          </h1>
          <button
            onClick={openModalForCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
            aria-label="Create New Announcement"
          >
            <FaPlus className="mr-2 h-5 w-5" />
            New Announcement
          </button>
        </div>

        <div className={`${isModalOpen ? 'blur-sm pointer-events-none' : ''} transition-all duration-300`}>
          {loading ? (
            <p className="text-center text-lg text-gray-600 dark:text-gray-400 py-10">Loading announcements...</p>
          ) : error && announcements.length === 0 ? ( 
            <div className="text-center py-10">
                <p className="text-red-500 dark:text-red-400 text-lg">{error}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Could not load announcements. Please try again later.</p>
            </div>
          ) : !loading && announcements.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 dark:text-indigo-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xl text-gray-700 dark:text-gray-300">No announcements posted yet.</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Click the "New Announcement" button to create one.</p>
            </div>
          ) : (
            <ul className="space-y-6">
              {announcements.map((ann) => (
                <li
                  key={ann._id}
                  className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
                >
                  <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{ann.title}</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-line leading-relaxed">{ann.content}</p>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm">
                    <p className="text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
                      Posted by: <span className="font-medium">{ann.postedBy?.name || 'You'}</span> on {new Date(ann.datePosted).toLocaleDateString()}
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(ann)}
                        className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-1 px-3 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        aria-label={`Edit announcement: ${ann.title}`}
                      >
                        <FaEdit className="mr-1.5 h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ann._id)}
                        className="flex items-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium py-1 px-3 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        aria-label={`Delete announcement: ${ann.title}`}
                      >
                        <FaTrashAlt className="mr-1.5 h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
           {error && announcements.length > 0 && ( // Display error below list if list is populated but an error occurs later
            <p className="text-red-500 dark:text-red-400 text-center mt-4">{error}</p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out" // Removed bg-black bg-opacity-75
          // onClick={() => setIsModalOpen(false)} // Optional: close modal on overlay click
        >
          <div 
            className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-95 animate-modalFadeInScale"
            onClick={(e) => e.stopPropagation()} // Prevents modal from closing when clicking inside it
            >
            <h3 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
              {form.id ? 'Edit Announcement' : 'Create New Announcement'}
            </h3>
            {error && <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-md mb-4 text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="title">Title <span className="text-red-500">*</span></label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="content">Content <span className="text-red-500">*</span></label>
                <textarea
                  id="content"
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  rows={5}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter announcement details"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto order-2 sm:order-1 flex-1 py-3 px-6 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto order-1 sm:order-2 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  {form.id ? 'Update Announcement' : 'Create Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* Add this to your global CSS (e.g., index.css or App.css) for the modal animation */
/*
@keyframes modalFadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-modalFadeInScale {
  animation: modalFadeInScale 0.3s ease-out forwards;
}
*/