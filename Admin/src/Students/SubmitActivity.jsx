import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaFileUpload, FaArrowLeft, FaPaperclip, FaCalendarAlt, FaStar, FaFileAlt, FaTimesCircle, FaTrash, FaDownload } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';

const SubmitActivity = () => {
  const { classId, activityId } = useParams();
  
  const [activity, setActivity] = useState(null);
  const [previousSubmission, setPreviousSubmission] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user?._id;

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const activityRes = await axios.get(`${API_BASE_URL}/activities/${activityId}`);
      setActivity(activityRes.data);

      try {
        const submissionRes = await axios.get(`${API_BASE_URL}/activities/submission`, {
          params: { activityId, studentId }
        });
        setPreviousSubmission(submissionRes.data);
      } catch (submissionError) {
        if (submissionError.response && submissionError.response.status === 404) {
          setPreviousSubmission(null);
        } else {
          console.error("Could not fetch previous submission:", submissionError);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activityId, studentId]);

  useEffect(() => {
    if (activityId && studentId) {
      fetchDetails();
    } else {
      setError("Required information is missing.");
      setLoading(false);
    }
  }, [activityId, studentId, fetchDetails]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to submit.');
      return;
    }
    if (!studentId) {
      setError('User not identified. Please log in again.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('studentId', studentId);
    formData.append('classId', classId);
    formData.append('activityId', activityId);

    try {
      const isResubmitting = !!previousSubmission;
      const endpoint = isResubmitting ? `/activities/resubmit/${previousSubmission._id}` : '/activities/submit';
      const method = isResubmitting ? 'put' : 'post';

      await axios({
        method: method,
        url: `${API_BASE_URL}${endpoint}`,
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('File submitted successfully! Refreshing...');
      setTimeout(() => {
        fetchDetails();
        setSelectedFile(null);
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during submission.');
      console.error('Submission Error:', err.response || err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!previousSubmission) return;

    if (!window.confirm('Are you sure you want to delete your submission? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await axios.delete(`${API_BASE_URL}/activities/submission/${previousSubmission._id}`);
      
      setSuccess('Submission deleted successfully.');
      setPreviousSubmission(null);
      setSelectedFile(null);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete submission.');
      console.error('Delete Error:', err.response || err);
    } finally {
      setSubmitting(false);
    }
  };

  const getAttachmentUrl = (filePath) => {
    if (!filePath) return '#';
    const normalizedPath = filePath.replace(/\\/g, '/');
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
    return `${SERVER_URL}/${cleanPath}`;
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!activity) return <div className="text-center p-10 text-red-500">{error || 'Activity could not be loaded.'}</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to={`/student/class/${classId}/activities`} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
            <FaArrowLeft />
            Back to Class Activities
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-3">
                {previousSubmission ? 'Your Submission' : 'Submit Your Work'}
              </h2>

              {previousSubmission && (
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Previously Submitted</h3>
                    <button type="button" onClick={handleDelete} disabled={submitting} className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50">
                      <FaTrash /> Delete
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <a href={getAttachmentUrl(previousSubmission.filePath)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
                      <FaFileAlt />
                      <span>{previousSubmission.fileName}</span>
                    </a>
                    <a href={`${API_BASE_URL}/activities/submission/${previousSubmission._id}/download`} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                      <FaDownload /> Download
                    </a>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {previousSubmission ? 'Upload a New Version' : 'Upload File'}
                </label>
                {!selectedFile ? (
                  <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <FaFileUpload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                          <span>Choose a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Any file type, up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaFileAlt className="text-indigo-500 dark:text-indigo-300 text-lg" />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedFile.name}</span>
                    </div>
                    <button type="button" onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-red-600">
                      <FaTimesCircle />
                    </button>
                  </div>
                )}
              </div>

              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
              {success && <p className="text-green-500 text-sm mt-4">{success}</p>}

              <div className="mt-6">
                <button type="submit" disabled={submitting || !selectedFile} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors">
                  {submitting ? 'Submitting...' : (previousSubmission ? 'Submit New Version' : 'Submit Assignment')}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{activity.title}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mt-3 border-b dark:border-gray-700 pb-4">
              <div className="flex items-center gap-1.5">
                <FaCalendarAlt />
                <strong>Due:</strong> {new Date(activity.date).toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5">
                <FaStar />
                <strong>Points:</strong> {activity.totalPoints || 100}
              </div>
            </div>
            {activity.description && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Instructions</h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{activity.description}</p>
              </div>
            )}
            {activity.attachment && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Attachment</h3>
                <div className="flex items-center gap-4">
                  <a href={getAttachmentUrl(activity.attachment)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors">
                      <FaPaperclip /> View Attachment
                  </a>
                  <a href={`${API_BASE_URL}/activities/${activity._id}/download`} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                      <FaDownload /> Download
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitActivity;