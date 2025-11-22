import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUpload, 
  FaFileAlt, 
  FaTimes, 
  FaDownload, 
  FaTrash, 
  FaEye,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

const UploadModule = () => {
  const { classId } = useParams();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/modules?classId=${classId}`);
      setModules(response.data || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !moduleTitle.trim()) {
      setError('Please select a file and enter a title');
      return;
    }

    const formData = new FormData();
    formData.append('module', selectedFile);
    formData.append('title', moduleTitle.trim());
    formData.append('description', moduleDescription.trim());
    formData.append('classId', classId);
    formData.append('uploadedBy', user._id);

    try {
      setUploading(true);
      setError(null);
      
      await axios.post(`${API_BASE_URL}/modules/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Module uploaded successfully!');
      setModuleTitle('');
      setModuleDescription('');
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('moduleFile');
      if (fileInput) fileInput.value = '';
      
      // Refresh modules list
      fetchModules();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload module');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/modules/${moduleId}`);
      setSuccess('Module deleted successfully!');
      fetchModules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete module');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconClass = "text-2xl";
    
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 px-2 sm:px-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg px-6 py-5 border border-indigo-100 dark:border-indigo-900 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow flex items-center gap-4">
          <FaUpload className="text-yellow-300 text-4xl drop-shadow-lg animate-pulse" />
          Upload Learning Modules
        </h1>
        <p className="text-indigo-100 mt-2">Upload and manage learning materials for your students</p>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl shadow-md flex items-center gap-2 mb-6">
          <FaCheck className="text-green-500" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-md flex items-center gap-2 mb-6">
          <FaExclamationTriangle className="text-red-500" />
          {error}
        </div>
      )}

      {/* Main Content - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-indigo-100 dark:border-indigo-900 overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
          <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          <FaUpload className="text-indigo-500" />
          Upload New Module
        </h2>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Module Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter module title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={moduleDescription}
              onChange={(e) => setModuleDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter module description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select File <span className="text-red-500">*</span>
            </label>
            <input
              id="moduleFile"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX (Max: 10MB)
            </p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              {getFileIcon(selectedFile.name)}
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !selectedFile || !moduleTitle.trim()}
            className={`w-full py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 ${
              uploading || !selectedFile || !moduleTitle.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FaUpload />
                Upload Module
              </>
            )}
          </button>
        </form>
          </div>
        </div>

        {/* Modules List */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-indigo-100 dark:border-indigo-900 overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
          <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          <FaFileAlt className="text-indigo-500" />
          Uploaded Modules
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="animate-spin text-2xl text-indigo-500 mr-3" />
            <span className="text-gray-600 dark:text-gray-300">Loading modules...</span>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaFileAlt className="text-4xl mb-3 mx-auto opacity-50" />
            <p>No modules uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((module) => (
              <div
                key={module._id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getFileIcon(module.fileName)}
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{module.title}</h3>
                    {module.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">{module.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>File: {module.fileName}</span>
                      <span>Size: {formatFileSize(module.fileSize)}</span>
                      <span>Uploaded: {new Date(module.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`${API_BASE_URL}/modules/download/${module._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                    title="Download"
                  >
                    <FaDownload />
                  </a>
                  <a
                    href={`${API_BASE_URL}/modules/view/${module._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-md transition-colors"
                    title="View"
                  >
                    <FaEye />
                  </a>
                  <button
                    onClick={() => handleDelete(module._id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModule;