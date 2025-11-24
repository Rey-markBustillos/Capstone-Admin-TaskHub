import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import { useParams } from 'react-router-dom';
import { FaPaperclip, FaListOl, FaPlusCircle, FaBook, FaTimes, FaTasks } from 'react-icons/fa';

const CreateActivity = () => {
  const { classId } = useParams();
  const [activityData, setActivityData] = useState({ title: '', description: '', date: '', score: '', attachment: null });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [className, setClassName] = useState('');
  const [activitiesList, setActivitiesList] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user?._id;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  const fetchClassData = useCallback(async () => {
    if (!classId) {
      setActivitiesError("Class not identified.");
      return;
    }
    setLoadingActivities(true);
    setActivitiesError('');
    try {
      const [classRes, activitiesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/class/${classId}`),
        axios.get(`${API_BASE_URL}/activities?classId=${classId}`)
      ]);
      setClassName(classRes.data.className);
      setActivitiesList(activitiesRes.data || []);
    } catch (err) {
      setActivitiesError(err.response?.data?.message || 'Failed to fetch class activities.');
    } finally {
      setLoadingActivities(false);
    }
  }, [classId, API_BASE_URL]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const handleFileChange = (e) => setActivityData({ ...activityData, attachment: e.target.files[0] });

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setActivityData({ title: '', description: '', date: '', score: '', attachment: null });
    setError('');
    setSuccess('');
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!activityData.title.trim() || !activityData.date) {
      setError('Title and Deadline are required.');
      return;
    }
    if (!teacherId) {
      setError('Teacher information not found. Please log in again.');
      return;
    }
    if (!classId) {
      setError('Class information not found.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', activityData.title);
      formData.append('description', activityData.description);
      formData.append('date', moment.tz(activityData.date, 'Asia/Manila').toISOString());
      formData.append('totalPoints', activityData.score);
      formData.append('classId', classId);
      formData.append('createdBy', teacherId);
      if (activityData.attachment) {
        formData.append('attachment', activityData.attachment);
      }
      await axios.post(`${API_BASE_URL}/activities`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Activity created successfully!');
      fetchClassData();
      setTimeout(() => {
        setSuccess('');
        closeCreateModal();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create activity.');
    }
  };

  return (
    <div>
      {/* Header Section with Icon */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500 rounded-xl shadow-lg px-6 py-5">
        <div className="flex items-center gap-4">
          <FaTasks className="text-yellow-300 text-4xl drop-shadow-lg animate-pulse" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow text-center sm:text-left">
            Activities for <span className="text-yellow-200">{className}</span>
          </h2>
        </div>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-150"
        >
          <FaPlusCircle className="mr-2" /> Create New Activity
        </button>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-gray-700">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 flex items-center">
                <FaPlusCircle className="mr-3 text-indigo-400" /> Create Activity
              </h3>
              <button onClick={closeCreateModal} className="text-gray-500 hover:text-gray-300 transition-colors" aria-label="Close modal">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow pr-2 space-y-5">
              {error && <div className="text-red-400 p-3 bg-red-900/30 rounded-lg text-sm text-center">{error}</div>}
              {success && <div className="text-green-400 p-3 bg-green-900/30 rounded-lg text-sm text-center">{success}</div>}
              {/* Form fields... */}
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="activity-title">Title<span className="text-red-400">*</span></label>
                <input
                  id="activity-title"
                  type="text"
                  className="w-full p-2 rounded bg-gray-900 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={activityData.title}
                  onChange={e => setActivityData({ ...activityData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="activity-description">Description</label>
                <textarea
                  id="activity-description"
                  className="w-full p-2 rounded bg-gray-900 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={activityData.description}
                  onChange={e => setActivityData({ ...activityData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="activity-date">Deadline<span className="text-red-400">*</span></label>
                <input
                  id="activity-date"
                  type="datetime-local"
                  className="w-full p-2 rounded bg-gray-900 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={activityData.date}
                  onChange={e => setActivityData({ ...activityData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="activity-score">Score</label>
                <input
                  id="activity-score"
                  type="number"
                  className="w-full p-2 rounded bg-gray-900 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={activityData.score}
                  onChange={e => setActivityData({ ...activityData, score: e.target.value })}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="activity-attachment">Attachment</label>
                <input
                  id="activity-attachment"
                  type="file"
                  className="w-full text-gray-100"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-150 mt-4"
              >
                <FaPlusCircle className="mr-2" /> Create Activity
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="w-full bg-gray-800/70 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
        <h3 className="text-2xl font-semibold mb-6 text-center text-gray-100 flex items-center justify-center">
          <FaListOl className="mr-3 text-indigo-400" /> Activities List
        </h3>
        <div className="overflow-y-auto max-h-[calc(100vh-22rem)]">
          {loadingActivities ? (
            <div className="text-gray-400 text-center py-4">Loading activities...</div>
          ) : activitiesError ? (
            <div className="text-red-400 text-center py-4">{activitiesError}</div>
          ) : activitiesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 text-gray-400 text-center py-8">
              <FaTasks className="text-yellow-300 text-4xl mb-2 animate-bounce" />
              <span className="text-lg">No activities found.</span>
            </div>
          ) : (
            <ul className="space-y-4">
              {activitiesList.map((activity) => (
                <li key={activity._id} className="bg-gray-700/60 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <div className="font-semibold text-indigo-300 text-lg flex items-center">
                      <FaBook className="mr-2" /> {activity.title}
                    </div>
                    <div className="text-gray-300 text-sm mt-1">{activity.description}</div>
                    <div className="text-gray-400 text-xs mt-1">
                      Deadline: {moment(activity.date).tz('Asia/Manila').format('YYYY-MM-DD HH:mm')}
                    </div>
                    {activity.attachment && (
                      <a
                        href={activity.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-indigo-400 hover:underline mt-2 text-xs"
                      >
                        <FaPaperclip className="mr-1" /> Attachment
                      </a>
                    )}
                  </div>
                  <div className="mt-2 sm:mt-0 text-gray-400 text-sm">
                    Score: {activity.score}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateActivity;