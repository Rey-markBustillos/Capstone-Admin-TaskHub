import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import { useParams } from 'react-router-dom';
import { FaPaperclip, FaListOl, FaPlusCircle, FaBook, FaTimes, FaTasks, FaEdit, FaTrashAlt, FaLock, FaUnlock } from 'react-icons/fa';

const CreateActivity = () => {
  const { classId } = useParams();
  const [activityData, setActivityData] = useState({ title: '', description: '', date: '', score: '', attachment: null });
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [className, setClassName] = useState('');
  const [activitiesList, setActivitiesList] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

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
      if (err.response?.status === 401) {
        setActivitiesError('Your session has expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setActivitiesError(err.response?.data?.message || 'Failed to fetch class activities.');
      }
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
    setFileInputKey(Date.now());
    setError('');
    setSuccess('');
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setFileInputKey(Date.now());
  };

  const openEditModal = (activity) => {
    setEditingActivity(activity);
    setActivityData({
      title: activity.title,
      description: activity.description,
      date: moment(activity.date).format('YYYY-MM-DDTHH:mm'),
      score: activity.totalPoints || activity.score || '',
      attachment: null
    });
    setFileInputKey(Date.now());
    setError('');
    setSuccess('');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingActivity(null);
    setActivityData({ title: '', description: '', date: '', score: '', attachment: null });
    setFileInputKey(Date.now());
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!activityData.title.trim() || !activityData.date) {
      setError('Title and Deadline are required.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', activityData.title);
      formData.append('description', activityData.description);
      formData.append('date', moment.tz(activityData.date, 'Asia/Manila').toISOString());
      formData.append('totalPoints', activityData.score);
      if (activityData.attachment) {
        formData.append('attachment', activityData.attachment);
      }
      await axios.put(`${API_BASE_URL}/activities/${editingActivity._id}`, formData);
      setSuccess('Activity updated successfully!');
      fetchClassData();
      setTimeout(() => {
        setSuccess('');
        closeEditModal();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update activity.');
    }
  };

  const handleDelete = async (activityId, activityTitle) => {
    if (window.confirm(`Are you sure you want to delete "${activityTitle}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`${API_BASE_URL}/activities/${activityId}`);
        setSuccess('Activity deleted successfully!');
        fetchClassData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete activity.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleToggleLock = async (activityId, currentLockStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/activities/${activityId}/lock`, {
        isLocked: !currentLockStatus
      });
      setSuccess(`Activity ${!currentLockStatus ? 'locked' : 'unlocked'} successfully!`);
      fetchClassData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle activity lock.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDownloadAttachment = async (attachmentUrl, activityId, activityTitle) => {
    try {
      // If it's a Cloudinary URL, download directly
      if (attachmentUrl.startsWith('http://') || attachmentUrl.startsWith('https://')) {
        window.open(attachmentUrl, '_blank');
        return;
      }
      
      // Otherwise, fetch through backend with auth headers
      const response = await axios.get(`${API_BASE_URL}/activities/${activityId}/download`, {
        responseType: 'blob'
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activityTitle}-attachment`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError(err.response?.data?.message || 'Failed to download attachment.');
      setTimeout(() => setError(''), 3000);
    }
  };

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
      await axios.post(`${API_BASE_URL}/activities`, formData);
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
    <div className="overflow-y-auto">
      {/* Global Success/Error Messages */}
      {success && !isCreateModalOpen && !isEditModalOpen && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg">
          {success}
        </div>
      )}
      {error && !isCreateModalOpen && !isEditModalOpen && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg">
          {error}
        </div>
      )}
      
      {/* Header Section with Icon */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-xl shadow-lg px-6 py-5 border-l-4 border-blue-400">
        <div className="flex items-center gap-4">
          <FaTasks className="text-blue-500 text-4xl drop-shadow-lg animate-pulse" />
          <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 drop-shadow text-center sm:text-left">
            Activities for <span className="text-indigo-600">{className}</span>
          </h2>
        </div>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-150"
        >
          <FaPlusCircle className="mr-2" /> Create New Activity
        </button>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-blue-200">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-200">
              <h3 className="text-xl sm:text-2xl font-semibold text-blue-900 flex items-center">
                <FaPlusCircle className="mr-3 text-blue-600" /> Create Activity
              </h3>
              <button onClick={closeCreateModal} className="text-gray-500 hover:text-gray-700 transition-colors" aria-label="Close modal">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow pr-2 space-y-5">
              {error && <div className="text-red-700 p-3 bg-red-100 rounded-lg text-sm text-center border border-red-300">{error}</div>}
              {success && <div className="text-green-700 p-3 bg-green-100 rounded-lg text-sm text-center border border-green-300">{success}</div>}
              {/* Form fields... */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium" htmlFor="activity-title">Title<span className="text-red-600">*</span></label>
                <input
                  id="activity-title"
                  type="text"
                  className="w-full p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activityData.title}
                  onChange={e => setActivityData({ ...activityData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium" htmlFor="activity-description">Instruction</label>
                <textarea
                  id="activity-description"
                  className="w-full p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activityData.description}
                  onChange={e => setActivityData({ ...activityData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium" htmlFor="activity-date">Deadline<span className="text-red-600">*</span></label>
                <input
                  id="activity-date"
                  type="datetime-local"
                  className="w-full p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activityData.date}
                  onChange={e => setActivityData({ ...activityData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium" htmlFor="activity-score">Score</label>
                <input
                  id="activity-score"
                  type="number"
                  className="w-full p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activityData.score}
                  onChange={e => setActivityData({ ...activityData, score: e.target.value })}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium" htmlFor="activity-attachment">Attachment</label>
                <input
                  key={fileInputKey}
                  id="activity-attachment"
                  type="file"
                  className="w-full text-gray-900"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-150 mt-4"
              >
                <FaPlusCircle className="mr-2" /> Create Activity
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-blue-200">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-200">
              <h3 className="text-xl sm:text-2xl font-semibold text-blue-900 flex items-center">
                <FaEdit className="mr-3 text-blue-600" /> Edit Activity
              </h3>
              <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700 transition-colors" aria-label="Close modal">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="overflow-y-auto flex-grow pr-2 space-y-5">
              {error && <div className="text-red-700 p-3 bg-red-100 rounded-lg text-sm text-center border border-red-300">{error}</div>}
              {success && <div className="text-green-700 p-3 bg-green-100 rounded-lg text-sm text-center border border-green-300">{success}</div>}
              <div>
                <label className="block text-gray-700 mb-2 font-medium" htmlFor="edit-activity-title">Title<span className="text-red-600">*</span></label>
                <input
                  id="edit-activity-title"
                  type="text"
                  className="w-full p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activityData.title}
                  onChange={e => setActivityData({ ...activityData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium" htmlFor="edit-activity-description">Description</label>
                <textarea
                  id="edit-activity-description"
                  className="w-full p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activityData.description}
                  onChange={e => setActivityData({ ...activityData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium" htmlFor="edit-activity-date">Deadline<span className="text-red-600">*</span></label>
                <input
                  id="edit-activity-date"
                  type="datetime-local"
                  className="w-full p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activityData.date}
                  onChange={e => setActivityData({ ...activityData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium" htmlFor="edit-activity-score">Score</label>
                <input
                  id="edit-activity-score"
                  type="number"
                  className="w-full p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activityData.score}
                  onChange={e => setActivityData({ ...activityData, score: e.target.value })}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium" htmlFor="edit-activity-attachment">New Attachment (optional)</label>
<input
  key={fileInputKey}
  id="activity-attachment"
  type="file"
  name="attachment" // <-- idagdag ito!
  className="w-full text-gray-900"
  onChange={handleFileChange}
  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx"
/>
                <p className="text-gray-600 text-xs mt-1">Leave empty to keep existing attachment</p>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-150 mt-4"
              >
                <FaEdit className="mr-2" /> Update Activity
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="w-full bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 sm:p-8 rounded-xl shadow-lg border-l-4 border-blue-400">
        <h3 className="text-2xl font-semibold mb-6 text-center text-blue-900 flex items-center justify-center">
          <FaListOl className="mr-3 text-blue-600" /> Activities List
        </h3>
        <div className="overflow-y-auto max-h-[calc(100vh-22rem)]">
          {loadingActivities ? (
            <div className="text-gray-600 text-center py-4">Loading activities...</div>
          ) : activitiesError ? (
            <div className="text-red-600 text-center py-4">{activitiesError}</div>
          ) : activitiesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 text-gray-600 text-center py-8">
              <FaTasks className="text-blue-500 text-4xl mb-2 animate-bounce" />
              <span className="text-lg">No activities found.</span>
            </div>
          ) : (
            <ul className="space-y-4">
              {activitiesList.map((activity) => (
                <li key={activity._id} className="bg-white rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-md border border-blue-200 hover:shadow-lg transition-shadow">
                  <div>
                    <div className="font-semibold text-blue-700 text-lg flex items-center">
                      <FaBook className="mr-2" /> {activity.title}
                      {activity.isLocked && (
                        <span className="ml-2 text-amber-600 text-sm flex items-center">
                          <FaLock className="mr-1" size={12} /> Locked
                        </span>
                      )}
                    </div>
                    <div className="text-gray-700 text-sm mt-1">{activity.description}</div>
                    <div className="text-gray-600 text-xs mt-1">
                      Deadline: {moment(activity.date).tz('Asia/Manila').format('YYYY-MM-DD HH:mm')}
                    </div>
                    {activity.attachment && (
                      <button
                        onClick={() => handleDownloadAttachment(activity.attachment, activity._id, activity.title)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 hover:underline mt-2 text-xs font-medium cursor-pointer bg-transparent border-none"
                        title={`View ${activity.title} attachment`}
                      >
                        <FaPaperclip className="mr-1" /> Attachment
                      </button>
                    )}
                  </div>
                  <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="text-gray-600 text-sm mb-2 sm:mb-0 sm:mr-4">
                      Score: {activity.totalPoints || activity.score || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(activity)}
                        className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Edit Activity"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleLock(activity._id, activity.isLocked)}
                        className={`p-2 rounded-lg transition-colors ${
                          activity.isLocked
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-100'
                        }`}
                        title={activity.isLocked ? 'Unlock Activity' : 'Lock Activity'}
                      >
                        {activity.isLocked ? <FaLock size={16} /> : <FaUnlock size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(activity._id, activity.title)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete Activity"
                      >
                        <FaTrashAlt size={16} />
                      </button>
                    </div>
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