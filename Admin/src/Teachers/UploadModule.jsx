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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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
      const apiUrl = `${API_BASE_URL}/modules?classId=${classId}`;
      console.log('📋 Fetching modules from:', apiUrl);
      const response = await axios.get(apiUrl);
      console.log('📋 Modules received:', response.data.length);
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

    if (!user || !user._id) {
      setError('User information not found. Please login again.');
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
      
      const uploadUrl = `${API_BASE_URL}/modules/upload`;
      console.log('📤 Uploading to:', uploadUrl);
      console.log('📤 FormData:', {
        title: moduleTitle,
        classId: classId,
        uploadedBy: user._id,
        fileName: selectedFile.name,
        fileSize: selectedFile.size
      });
      
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for large files
      });

      console.log('✅ Upload successful:', response.data);
      setSuccess('Module uploaded successfully!');
      setModuleTitle('');
      setModuleDescription('');
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('moduleFile');
      if (fileInput) fileInput.value = '';
      
      // Refresh modules list
      await fetchModules();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('❌ Upload error:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to upload module');
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
    <div className="min-h-full bg-white py-8 px-2 sm:px-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg px-6 py-5 border border-blue-300 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow flex items-center gap-4">
          <FaUpload className="text-blue-100 text-4xl drop-shadow-lg animate-pulse" />
          Upload Learning Modules
        </h1>
        <p className="text-blue-50 mt-2">Upload and manage learning materials for your students</p>
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
        <div className="bg-white shadow-xl rounded-2xl border border-blue-200 overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
          <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-900 flex items-center gap-2">
          <FaUpload className="text-blue-600" />
          Upload New Module
        </h2>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="Enter module title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={moduleDescription}
              onChange={(e) => setModuleDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="Enter module description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File <span className="text-red-500">*</span>
            </label>
            <input
              id="moduleFile"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX (Max: 10MB)
            </p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md border border-blue-200">
              {getFileIcon(selectedFile.name)}
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !selectedFile || !moduleTitle.trim()}
            className={`w-full py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 ${
              uploading || !selectedFile || !moduleTitle.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
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
        <div className="bg-white shadow-xl rounded-2xl border border-blue-200 overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
          <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaFileAlt className="text-blue-600" />
            Uploaded Modules
          </div>
          {modules.length > 0 && (
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              {modules.length} module{modules.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="animate-spin text-2xl text-blue-600 mr-3" />
            <span className="text-gray-700">Loading modules...</span>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <FaFileAlt className="text-4xl mb-3 mx-auto opacity-50" />
            <p>No modules uploaded yet</p>
          </div>
        ) : (
          <div className="relative">
            {modules.length > 3 && (
              <div className="absolute top-0 right-0 z-10 bg-gradient-to-l from-white to-transparent w-8 h-6 flex items-center justify-end pr-1">
                <div className="text-gray-400 text-xs">↓</div>
              </div>
            )}
            <div 
              className="max-h-96 overflow-y-auto pr-2 space-y-3 border border-blue-200 rounded-lg p-3"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#3b82f6 #dbeafe'
              }}
            >
              {modules.map((module) => (
              <div
                key={module._id}
                className="flex items-start justify-between p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-1">
                    {getFileIcon(module.fileName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{module.title}</h3>
                    {module.description && (
                      <p className="text-sm text-gray-700 line-clamp-2 mt-1">{module.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-2">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {module.fileName}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {formatFileSize(module.fileSize)}
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                        {new Date(module.uploadDate).toLocaleDateString()}
                      </span>
                      {module.cloudinaryUrl ? (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded" title="Stored in cloud">
                          ☁️ Cloud
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded" title="Legacy local file">
                          📁 Local
                        </span>
                      )}
                      {module.downloadCount > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded" title="Download count">
                          📥 {module.downloadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                  <button
                    onClick={() => {
                      console.log('📋 Download module:', module.title, module._id);
                      
                      // Check if module has Cloudinary URL
                      if (module.cloudinaryUrl) {
                        // Use Cloudinary URL with download transformation
                        const downloadUrl = module.cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = module.fileName;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } else {
                        // Use backend download route for legacy files
                        const downloadUrl = `${API_BASE_URL}/modules/download/${module._id}`;
                        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                    title="Download"
                  >
                    <FaDownload size={14} />
                  </button>
                  <button
                    onClick={() => {
                      console.log('👀 View module:', module.title, module._id);
                      
                      // Check if module has Cloudinary URL
                      if (module.cloudinaryUrl) {
                        window.open(module.cloudinaryUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        // Use backend view route for legacy files
                        window.open(`${API_BASE_URL}/modules/view/${module._id}`, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-md transition-colors"
                    title="View"
                  >
                    <FaEye size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(module._id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
                    title="Delete"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {modules.length > 3 && (
            <div className="absolute bottom-0 right-0 z-10 bg-gradient-to-l from-white to-transparent w-8 h-6 flex items-center justify-end pr-1">
              <div className="text-gray-400 text-xs">↑</div>
            </div>
          )}
        </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModule;