import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaFileUpload, FaArrowLeft, FaPaperclip, FaCalendarAlt, FaStar, FaFileAlt, FaTimesCircle, FaTrash, FaDownload } from 'react-icons/fa';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

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
  const [fileInputKey, setFileInputKey] = useState(Date.now());
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
      // Fetch activity details
      const activityRes = await axios.get(`${API_BASE_URL}/activities/${activityId}`);
      setActivity(activityRes.data);
      
      // Try to fetch previous submission - completely silent if it fails
      try {
        const submissionRes = await axios.get(`${API_BASE_URL}/activities/submission`, {
          params: { activityId, studentId }
        });
        setPreviousSubmission(submissionRes.data);
      } catch (submissionError) {
        // Silently handle all submission fetch errors
        // 404 = no submission yet (expected)
        // Other errors = route not available on deployed backend
        setPreviousSubmission(null);
        
        // Only redirect if it's an auth issue
        if (submissionError.response?.status === 401 || submissionError.response?.status === 403) {
          setError('Your session has expired. Please login again.');
          setTimeout(() => window.location.href = '/login', 2000);
        }
        // Don't show any other errors to user
      }
    } catch (err) {
      // Handle activity fetch errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        setError(err.response?.data?.message || 'Failed to load activity details.');
      }
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
        setFileInputKey(Date.now());
      }, 2000);

    } catch (err) {
      console.error('Submission Error:', err.response || err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.status === 403) {
        setError('You do not have permission to perform this action.');
      } else {
        setError(err.response?.data?.message || 'An error occurred during submission.');
      }
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
    // If it's already a full URL (Cloudinary), return as-is with double extension fix
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath.replace(/(\.[^./?]+)\1+(?=($|\?))/i, "$1");  // Remove .pdf.pdf
    }
    // Otherwise, construct URL from API base
    const normalizedPath = filePath.replace(/\\/g, '/');
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
    return `${API_BASE_URL}/${cleanPath}`;
  };

  if (loading) return <div className="flex justify-center items-center h-screen overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50">Loading...</div>;
  if (!activity) return <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center"><div className="text-center p-10 text-red-500 bg-white rounded-xl shadow-lg">{error || 'Activity could not be loaded.'}</div></div>;

  return (
    <div className="min-h-screen overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to={`/student/class/${classId}/activities`} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all min-h-[44px]">
            <FaArrowLeft />
            Back to Class Activities
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="relative bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-blue-200 overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-blue-300 rounded-l-xl" />
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-6 border-b-2 border-blue-100 pb-4 flex items-center gap-2">
                <FaFileUpload className="text-blue-600 text-xl sm:text-2xl" />
                {previousSubmission ? 'Your Submission' : 'Submit Your Work'}
              </h2>

              {previousSubmission && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-blue-900">Previously Submitted</h3>
                    <button type="button" onClick={handleDelete} disabled={submitting} className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50">
                      <FaTrash /> Delete
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <a href={getAttachmentUrl(previousSubmission.filePath)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 text-sm hover:underline">
                      <FaFileAlt />
                      <span>{previousSubmission.fileName}</span>
                    </a>
                    <a href={`${API_BASE_URL}/activities/submission/${previousSubmission._id}/download`} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
                      <FaDownload /> Download
                    </a>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                  {previousSubmission ? 'Upload a New Version' : 'Upload File'}
                </label>
                {!selectedFile ? (
                  <>
                  <div className="mt-1 flex flex-col items-center justify-center gap-4 px-6 pt-8 pb-8 border-2 border-blue-300 border-dashed rounded-lg bg-blue-50/30">
                    <div className="space-y-1 text-center">
                      <FaFileUpload className="mx-auto h-12 w-12 text-blue-400" />
                      <div className="flex flex-col gap-2 justify-center items-center text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-700 px-3 py-2 shadow-sm border border-blue-200">
                          <span>Choose a file</span>
                          <input key={fileInputKey} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Any file type, up to 10MB</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-4 w-full flex justify-center items-center gap-2 py-3 sm:py-4 rounded-lg bg-blue-600 text-white text-sm sm:text-base font-semibold hover:bg-blue-700 transition shadow-md min-h-[44px]"
                    onClick={openCamera}
                  >
                    <FaFileUpload className="inline-block text-lg" /> Use Camera
                  </button>
                  {/* Camera modal */}
                  {showCamera && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                      <div className="bg-white rounded-lg shadow-2xl p-6 flex flex-col items-center relative border-2 border-blue-200">
                        <button type="button" className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl" onClick={closeCamera}>&times;</button>
                        <video ref={videoRef} autoPlay playsInline className="rounded-lg border mb-4 max-w-full" style={{ width: 320, height: 240, background: '#222' }} />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        {cameraError && <p className="text-red-500 mb-2">{cameraError}</p>}
                        <button type="button" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md min-h-[44px]" onClick={capturePhoto}>Capture Photo</button>
                      </div>
                    </div>
                  )}
                  </>
                ) : (
                  <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-200">
                    <div className="flex items-center gap-3">
                      <FaFileAlt className="text-blue-600 text-lg" />
                      <span className="text-sm font-medium text-gray-800">{selectedFile.name}</span>
                    </div>
                    <button type="button" onClick={() => { setSelectedFile(null); setFileInputKey(Date.now()); }} className="text-gray-500 hover:text-red-600">
                      <FaTimesCircle />
                    </button>
                  </div>
                )}
              </div>

              {error && <p className="text-red-500 text-sm mt-4 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
              {success && <p className="text-green-600 text-sm mt-4 bg-green-50 border border-green-200 rounded-lg p-3">{success}</p>}

              <div className="mt-6">
                <button type="submit" disabled={submitting || !selectedFile} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm sm:text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors min-h-[44px]">
                  {submitting ? 'Submitting...' : (previousSubmission ? 'Submit New Version' : 'Submit Assignment')}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-3 bg-white rounded-xl shadow-lg p-6 border border-blue-200">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">{activity.title}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 border-b border-blue-200 mt-3 pb-4">
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
                <h3 className="font-semibold text-gray-800 mb-2">Instructions</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{activity.description}</p>
              </div>
            )}
            {activity.attachment && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-2">Attachment</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <a href={`${API_BASE_URL.replace(/\/$/, '')}/activities/${activity._id}/download`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors shadow-md min-h-[44px]">
                      <FaPaperclip /> View Attachment
                  </a>
                  <a href={`${API_BASE_URL.replace(/\/$/, '')}/activities/${activity._id}/download`} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg px-4 py-2 transition-colors shadow-sm min-h-[44px]">
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