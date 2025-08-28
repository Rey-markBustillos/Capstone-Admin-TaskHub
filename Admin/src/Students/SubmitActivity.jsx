import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaFileUpload, FaArrowLeft, FaPaperclip, FaCalendarAlt, FaStar, FaFileAlt, FaTimesCircle, FaTrash, FaDownload } from 'react-icons/fa';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SERVER_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000/api';

const SubmitActivity = () => {
  const { classId, activityId } = useParams();
  
  const [activity, setActivity] = useState(null);
  const [previousSubmission, setPreviousSubmission] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  // Get studentId from localStorage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user?._id;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  // Fetch activity and previous submission
  const fetchDetails = async () => {
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
          setError('Could not fetch previous submission.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity details.');
    } finally {
      setLoading(false);
    }
  };

  // Camera logic
  const openCamera = async () => {
    setCameraError('');
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Unable to access camera.');
    }
  };

  const closeCamera = () => {
    setShowCamera(false);
    setCameraError('');
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.png`, { type: 'image/png' });
        setSelectedFile(file);
        setShowCamera(false);
        setCameraError('');
        // Stop the camera stream after capturing
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }
    });
  };

  useEffect(() => {
    if (activityId && studentId) {
      fetchDetails();
    } else {
      setError("Required information is missing.");
      setLoading(false);
    }
    // Only run on mount or when activityId/studentId changes
    // eslint-disable-next-line
  }, [activityId, studentId]);

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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 overflow-hidden">
      {/* Animated, blurred SVG background for extra depth and floating blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full blur-2xl opacity-40 animate-pulse-slow" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="bg1" cx="50%" cy="50%" r="80%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
            </radialGradient>
            <linearGradient id="scrollbg1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#18181b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.3" />
            </linearGradient>
            <radialGradient id="blob1" cx="50%" cy="50%" r="80%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
            </radialGradient>
          </defs>
          <ellipse cx="600" cy="200" rx="420" ry="120" fill="url(#bg1)" />
          <ellipse cx="600" cy="250" rx="320" ry="60" fill="url(#scrollbg1)" />
          <ellipse cx="300" cy="100" rx="120" ry="60" fill="url(#blob1)" className="animate-float-slow" />
          <ellipse cx="950" cy="320" rx="100" ry="40" fill="url(#blob1)" className="animate-float-slower" />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to={`/student/class/${classId}/activities`} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 hover:from-indigo-800 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
            <FaArrowLeft />
            Back to Class Activities
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="relative bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl p-8 border border-indigo-100 dark:border-gray-700 backdrop-blur-md overflow-hidden group transition-all duration-300 hover:shadow-[0_8px_40px_0_rgba(99,102,241,0.25)] hover:border-indigo-300">
              {/* Animated accent bar */}
              <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-indigo-500 via-blue-500 to-transparent rounded-l-2xl opacity-80 animate-pulse" />
              {/* Soft inner shadow */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{boxShadow:'inset 0 2px 24px 0 rgba(99,102,241,0.10)'}} />
              {/* Subtle border glow on hover */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-indigo-400 group-hover:shadow-[0_0_24px_0_rgba(99,102,241,0.15)] pointer-events-none transition-all duration-300" />
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 border-b-2 border-indigo-100 dark:border-gray-800 pb-4 tracking-tight flex items-center gap-2">
                <FaFileUpload className="text-indigo-500 dark:text-indigo-400 text-2xl animate-bounce-slow" />
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
                  <>
                  <div className="mt-1 flex flex-col items-center justify-center gap-4 px-6 pt-8 pb-8 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <FaFileUpload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex flex-col gap-2 justify-center items-center text-sm text-gray-600 dark:text-gray-400">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 px-2 py-1">
                          <span>Choose a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Any file type, up to 10MB</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-4 w-full flex justify-center items-center gap-2 py-4 rounded-lg bg-indigo-600 text-white text-base font-semibold hover:bg-indigo-700 transition shadow-lg"
                    onClick={openCamera}
                  >
                    <FaFileUpload className="inline-block text-lg" /> Use Camera
                  </button>
                  {/* Camera modal */}
                  {showCamera && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 flex flex-col items-center relative">
                        <button type="button" className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl" onClick={closeCamera}>&times;</button>
                        <video ref={videoRef} autoPlay playsInline className="rounded-lg border mb-4 max-w-full" style={{ width: 320, height: 240, background: '#222' }} />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        {cameraError && <p className="text-red-500 mb-2">{cameraError}</p>}
                        <button type="button" className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition" onClick={capturePhoto}>Capture Photo</button>
                      </div>
                    </div>
                  )}
                  </>
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