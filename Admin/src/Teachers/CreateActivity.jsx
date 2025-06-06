import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import Navbar from '../components/Navbar';
import { FaPaperclip, FaListOl, FaPlusCircle, FaBook, FaTimes } from 'react-icons/fa'; // Added FaTimes for close icon

const CreateActivity = () => {
  const [activityData, setActivityData] = useState({
    title: '',
    description: '',
    date: '',
    score: '',
    attachment: null,
    classId: '',
    createdBy: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classes, setClasses] = useState([]);

  const [activitiesList, setActivitiesList] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State for modal

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user && user.role === 'teacher' ? user._id : null;

  useEffect(() => {
    if (!teacherId) {
      // setError('Teacher not logged in. Unable to load classes.'); // Error handled by specific components
      return;
    }
    // setError(''); // Clear general error
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/classes?teacherId=${teacherId}`);
        setClasses(res.data || []);
      } catch (err) {
        // setError(err.response?.data?.message || 'Failed to fetch classes.'); // Error specific to class fetching
        console.error("Failed to fetch classes:", err);
      }
    };
    fetchClasses();
  }, [teacherId]);

  const fetchTeacherActivities = useCallback(async () => {
    if (!teacherId) {
      setActivitiesList([]);
      return;
    }
    setLoadingActivities(true);
    setActivitiesError('');
    try {
      const res = await axios.get(`http://localhost:5000/api/activities?teacherId=${teacherId}&populate=classId`);
      const filtered = (res.data || []).filter(
        (activity) => (activity.createdBy?._id || activity.createdBy) === teacherId
      );
      setActivitiesList(filtered);
    } catch (err) {
      setActivitiesError(err.response?.data?.message || 'Failed to fetch activities list.');
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoadingActivities(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchTeacherActivities();
  }, [fetchTeacherActivities]);

  const handleChange = (e) => {
    setActivityData({ ...activityData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setActivityData({ ...activityData, attachment: e.target.files[0] });
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    // Reset form and messages when opening
    setActivityData({ title: '', description: '', date: '', score: '', attachment: null, classId: '', createdBy: '' });
    setError('');
    setSuccess('');
    const fileInput = document.getElementById('attachment-modal');
    if (fileInput) fileInput.value = '';
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!activityData.classId) {
      setError('Please select a class.');
      return;
    }
    if (!activityData.title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!activityData.date) {
      setError('Please select a date and time.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', activityData.title);
      formData.append('description', activityData.description);
      formData.append('date', moment.tz(activityData.date, 'Asia/Manila').toISOString());
      formData.append('score', activityData.score);
      formData.append('classId', activityData.classId);
      formData.append('createdBy', teacherId);

      if (activityData.attachment) {
        formData.append('attachment', activityData.attachment);
      }

      await axios.post('http://localhost:5000/api/activities', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Activity created successfully!');
      setActivityData({ // Reset form fields
        title: '', description: '', date: '', score: '', attachment: null, classId: '', createdBy: '',
      });
      const fileInput = document.getElementById('attachment-modal'); // Use new ID for file input in modal
      if (fileInput) fileInput.value = '';
      
      fetchTeacherActivities();
      setTimeout(() => {
        setSuccess('');
        closeCreateModal(); // Close modal after success message
      }, 1500); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create activity.');
      setTimeout(() => setError(''), 5000); // Error message will clear itself
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 text-center sm:text-left">Manage Activities</h2>
          <button
            onClick={openCreateModal}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-150"
          >
            <FaPlusCircle className="mr-2" /> Create New Activity
          </button>
        </div>

        {/* Create Activity Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                  <FaPlusCircle className="mr-3 text-indigo-600 dark:text-indigo-400" /> Create New Activity
                </h3>
                <button 
                  onClick={closeCreateModal} 
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close modal"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="overflow-y-auto flex-grow pr-2 space-y-5"> {/* Added pr-2 for scrollbar spacing */}
                {error && <div className="text-red-600 dark:text-red-400 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-sm text-center animate-pulse">{error}</div>}
                {success && <div className="text-green-600 dark:text-green-400 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-sm text-center">{success}</div>}
              
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="title-modal">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 placeholder-gray-400 dark:placeholder-gray-500"
                      id="title-modal" name="title" type="text" placeholder="e.g., Math Homework 1"
                      value={activityData.title} onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="description-modal">
                      Description
                    </label>
                    <textarea
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 placeholder-gray-400 dark:placeholder-gray-500"
                      id="description-modal" name="description" placeholder="Instructions or details about the activity"
                      value={activityData.description} onChange={handleChange} rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="date-modal">
                        Deadline <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
                        id="date-modal" name="date" type="datetime-local"
                        value={activityData.date} onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="score-modal">
                        Max Score
                      </label>
                      <input
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 placeholder-gray-400 dark:placeholder-gray-500"
                        id="score-modal" name="score" type="number" placeholder="e.g., 100"
                        value={activityData.score} onChange={handleChange} min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="attachment-modal">
                      Attachment (Optional)
                    </label>
                    <input
                      className="w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none file:mr-4 file:py-3 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/40"
                      id="attachment-modal" name="attachment" type="file"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="classId-modal">
                      Assign to Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
                      id="classId-modal" name="classId" value={activityData.classId} onChange={handleChange}
                    >
                      <option value="">Select a class</option>
                      {classes.length > 0 ? classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.className}
                        </option>
                      )) : <option disabled>No classes available to assign</option>}
                    </select>
                  </div>
                  <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700"> {/* Modal Actions */}
                    <button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-150 flex items-center justify-center"
                      type="submit"
                    >
                      <FaPlusCircle className="mr-2" /> Create Activity
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Activity List */}
        <div className="w-full bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
          <h3 className="sticky top-0 z-10 bg-white dark:bg-gray-800 py-3 text-2xl font-semibold mb-6 text-center text-gray-800 dark:text-gray-100 flex items-center justify-center">
            <FaListOl className="mr-3 text-indigo-600 dark:text-indigo-400" /> My Activities
          </h3>
          <div className="overflow-y-auto max-h-[calc(100vh-22rem)]"> {/* Adjusted max-height for the content area of the list card */}
            {loadingActivities && <p className="text-center text-gray-500 dark:text-gray-400 py-4">Loading activities...</p>}
            {activitiesError && <div className="text-red-600 dark:text-red-400 my-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-sm text-center">{activitiesError}</div>}
            
            {!loadingActivities && !activitiesError && activitiesList.length === 0 && (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <FaBook size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No activities found.</p>
                <p className="text-sm">Click the "Create New Activity" button above to add one.</p>
              </div>
            )}

            {activitiesList.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full table-auto text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase sticky top-0 z-[5]"> {/* Ensure table header is above content but below modal */}
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold">Title</th>
                      <th className="px-5 py-3 text-left font-semibold">Class</th>
                      <th className="px-5 py-3 text-left font-semibold">Deadline</th>
                      <th className="px-5 py-3 text-center font-semibold">Score</th>
                      <th className="px-5 py-3 text-center font-semibold">Attachment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {activitiesList.map((activity) => (
                      <tr key={activity._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                        <td className="px-5 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200 font-medium">{activity.title}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{activity.classId?.className || 'N/A'}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{moment(activity.date).tz('Asia/Manila').format('MMM D, YYYY, h:mm A')}</td>
                        <td className="px-5 py-4 text-center whitespace-nowrap text-gray-600 dark:text-gray-400">{activity.score || '-'}</td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {activity.attachment ? (
                            <a
                              href={`http://localhost:5000${activity.attachment}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline inline-flex items-center"
                            >
                              <FaPaperclip className="mr-1" /> View
                            </a>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateActivity;