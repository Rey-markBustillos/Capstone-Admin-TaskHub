import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaBook, 
  FaDownload, 
  FaEye,
  FaSpinner,
  FaExclamationTriangle,
  FaFileAlt,
  FaCalendarAlt,
  FaUser,
  FaArrowLeft
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const StudentModules = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug: Log component mount and classId
  useEffect(() => {
    console.log('StudentModules component mounted');
    console.log('ClassId from params:', classId);
    console.log('API_BASE_URL:', API_BASE_URL);
  }, [classId]);

    const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching modules for classId:', classId);
      console.log('API URL:', `${API_BASE_URL}/modules?classId=${classId}`);
      const response = await axios.get(`${API_BASE_URL}/modules?classId=${classId}`);
      console.log('Modules response:', response.data);
      setModules(response.data || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (classId) {
      fetchModules();
    } else {
      setError('Class ID not found');
      setLoading(false);
    }
  }, [fetchModules, classId]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconClass = "text-3xl";
    
    switch (extension) {
      case 'pdf':
        return <FaFileAlt className={`${iconClass} text-red-500`} />;
      case 'doc':
      case 'docx':
        return <FaFileAlt className={`${iconClass} text-blue-500`} />;
      case 'ppt':
      case 'pptx':
        return <FaFileAlt className={`${iconClass} text-orange-500`} />;
      case 'xls':
      case 'xlsx':
        return <FaFileAlt className={`${iconClass} text-green-500`} />;
      default:
        return <FaFileAlt className={`${iconClass} text-gray-500`} />;
    }
  };

  const handleDownload = async (moduleId, fileName) => {
    try {
      console.log('Downloading module:', moduleId, fileName);
      console.log('Download URL:', `${API_BASE_URL}/modules/download/${moduleId}`);
      
      const response = await axios.get(`${API_BASE_URL}/modules/download/${moduleId}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      console.error('Download error details:', err.response?.data);
      alert(`Failed to download module: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleView = (moduleId) => {
    console.log('Opening view for module:', moduleId);
    console.log('View URL:', `${API_BASE_URL}/modules/view/${moduleId}`);
    window.open(`${API_BASE_URL}/modules/view/${moduleId}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/student/class/${classId}`)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
      >
        <FaArrowLeft className="text-sm" />
        Back to Class Menu
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
          <FaBook className="text-yellow-300" />
          Learning Modules
        </h1>
        <p className="text-blue-100">Access course materials and resources uploaded by your teacher</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <FaExclamationTriangle className="text-red-500" />
          {error}
        </div>
      )}

      {/* Modules List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-3xl text-blue-500 mr-3" />
            <span className="text-lg text-gray-600 dark:text-gray-300">Loading modules...</span>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FaBook className="text-6xl mb-4 mx-auto opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Modules Available</h3>
            <p>Your teacher hasn't uploaded any learning modules yet.</p>
            <div className="mt-4 text-sm text-gray-400">
              <p>Debug Info:</p>
              <p>Class ID: {classId}</p>
              <p>API URL: {API_BASE_URL}/modules?classId={classId}</p>
              <p>Modules Array Length: {modules.length}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {modules.map((module) => (
              <div
                key={module._id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {getFileIcon(module.fileName)}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {module.title}
                    </h3>
                    
                    {module.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {module.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <FaFileAlt className="text-xs" />
                        <span>{module.fileName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt className="text-xs" />
                        <span>Uploaded: {new Date(module.uploadDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaUser className="text-xs" />
                        <span>By: {module.uploadedBy?.name || 'Teacher'}</span>
                      </div>
                      <div>
                        <span>Size: {formatFileSize(module.fileSize)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleView(module._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                      title="View Module"
                    >
                      <FaEye className="text-sm" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      onClick={() => handleDownload(module._id, module.fileName)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                      title="Download Module"
                    >
                      <FaDownload className="text-sm" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {modules.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Total modules: {modules.length}</span>
            <span>Total size: {formatFileSize(modules.reduce((total, module) => total + module.fileSize, 0))}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentModules;