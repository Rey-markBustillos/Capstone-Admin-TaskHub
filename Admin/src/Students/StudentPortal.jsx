import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserTie, FaMapMarkerAlt, FaClock, FaExternalLinkAlt, FaPaperclip } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5000/api';

const StudentPortal = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [submissions, setSubmissions] = useState([]);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user && user.role === 'student' ? user._id : null;

  useEffect(() => {
    if (!studentId) {
      setError('Student not logged in. Please log in again.');
      setLoading(false);
      return;
    }
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/classes?studentId=${studentId}`);
        setClasses(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch classes.');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [studentId]);

  useEffect(() => {
    if (!selectedClass) {
      setActivities([]);
      setSubmissions([]);
      return;
    }

    const fetchActivitiesAndSubmissions = async () => {
      setActivitiesLoading(true);
      setActivitiesError(null);
      try {
        const [activitiesRes, submissionsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/activities?classId=${selectedClass._id}`),
          axios.get(`${API_BASE_URL}/activities/submissions?classId=${selectedClass._id}&studentId=${studentId}`)
        ]);
        setActivities(activitiesRes.data);
        setSubmissions(submissionsRes.data);
      } catch (err) {
        setActivitiesError(err.response?.data?.message || 'Failed to fetch activities.');
      } finally {
        setActivitiesLoading(false);
      }
    };
    fetchActivitiesAndSubmissions();
  }, [selectedClass, studentId]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadError('');
    setUploadSuccess('');
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedActivity || !studentId) {
      setUploadError('File, activity, or student is missing.');
      return;
    }

    const formData = new FormData();
    formData.append('attachment', file);
    formData.append('activityId', selectedActivity._id);
    formData.append('studentId', studentId);

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/activities/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess('File uploaded successfully!');
      setFile(null);
      // Refetch submissions to update status and close modal
      const submissionsRes = await axios.get(`${API_BASE_URL}/activities/submissions?classId=${selectedClass._id}&studentId=${studentId}`);
      setSubmissions(submissionsRes.data);
      setSelectedActivity(null);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const getSubmissionForActivity = (activityId) => {
    return submissions.find((sub) => sub.activityId === activityId || sub.activityId?._id === activityId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <p className="text-xl text-red-500 text-center">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 pt-6">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Your Enrolled Classes</h1>
            <hr className="mt-3 border-t-2 border-gray-300 dark:border-gray-600" />
          </div>

          {classes.length === 0 ? (
            <div className="text-center py-10 mt-6">
              <p className="text-xl text-gray-600 dark:text-gray-400">You are not enrolled in any classes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <div
                  key={cls._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer flex flex-col overflow-hidden"
                  onClick={() => setSelectedClass(cls)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedClass(cls)}
                >
                  <div className="p-6 flex-grow">
                    <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 truncate" title={cls.className}>
                      {cls.className}
                    </h2>
                    <div className="space-y-3 text-sm mt-4">
                      <p className="text-gray-700 dark:text-gray-300 flex items-center">
                        <FaUserTie size={16} className="mr-3 text-indigo-500 dark:text-indigo-400" />
                        <strong>Teacher:</strong>&nbsp;{cls.teacherName}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 flex items-center">
                        <FaClock size={16} className="mr-3 text-indigo-500 dark:text-indigo-400" />
                        <strong>Time:</strong>&nbsp;{cls.time ? new Date(cls.time).toLocaleString() : 'TBA'}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 flex items-center">
                        <FaMapMarkerAlt size={16} className="mr-3 text-indigo-500 dark:text-indigo-400" />
                        <strong>Room:</strong>&nbsp;{cls.roomNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold text-center">
                      View Activities &rarr;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Activities Modal */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedClass(null)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl p-6 md:p-8 overflow-hidden relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="activities-modal-title"
          >
            <h2 id="activities-modal-title" className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
              Activities for {selectedClass.className}
            </h2>
            <div className="overflow-y-auto flex-grow">
              {activitiesLoading ? <p className="text-center dark:text-gray-300">Loading activities...</p> :
               activitiesError ? <p className="text-red-500 text-center">Error: {activitiesError}</p> :
               activities.length === 0 ? <p className="text-center dark:text-gray-300">No activities available for this class.</p> :
                (
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {['Title', 'Status', 'Due Date', 'Score', 'Link', 'My Submission'].map(header => (
                            <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {activities.map((activity) => {
                          const submission = getSubmissionForActivity(activity._id);
                          const hasSubmitted = !!submission;
                          const isPastDue = new Date() > new Date(activity.date);
                          let statusText = 'Pending';
                          let statusStyle = 'bg-gray-200 text-gray-800';
                          if (hasSubmitted) {
                            statusText = new Date(submission.submissionDate) > new Date(activity.date) ? 'Late' : 'Submitted';
                            statusStyle = statusText === 'Late' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
                          } else if (isPastDue) {
                            statusText = 'Missing';
                            statusStyle = 'bg-red-100 text-red-800';
                          }
                          return (
                            <tr key={activity._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${!hasSubmitted && 'cursor-pointer'}`} onClick={() => !hasSubmitted && setSelectedActivity(activity)}>
                              <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{activity.title}</td>
                              <td className="px-4 py-4"><span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusStyle}`}>{statusText}</span></td>
                              <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{activity.date ? new Date(activity.date).toLocaleString() : 'N/A'}</td>
                              <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{submission?.score ?? '-'}</td>
                              <td className="px-4 py-4">{activity.link ? <a href={activity.link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline"><FaExternalLinkAlt /></a> : '-'}</td>
                              <td className="px-4 py-4">{submission?.attachment ? <a href={`http://localhost:5000${submission.attachment}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline"><FaPaperclip /></a> : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" onClick={() => setSelectedClass(null)}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Submit Attachment Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" onClick={() => setSelectedActivity(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 md:p-8 relative" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Submit for: {selectedActivity.title}</h2>
            <p className="mb-2 text-gray-600 dark:text-gray-300"><strong>Description:</strong> {selectedActivity.description || 'No description'}</p>
            <p className="mb-4 text-gray-600 dark:text-gray-300"><strong>Due:</strong> {selectedActivity.date ? new Date(selectedActivity.date).toLocaleString() : 'N/A'}</p>
            <form onSubmit={handleFileSubmit} className="flex flex-col gap-4">
              <input type="file" onChange={handleFileChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300" />
              {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
              {uploadSuccess && <p className="text-green-500 text-sm">{uploadSuccess}</p>}
              <div className="flex justify-end gap-4 mt-4">
                <button type="button" className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500" onClick={() => setSelectedActivity(null)}>Cancel</button>
                <button type="submit" disabled={uploading || !file} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">{uploading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentPortal;