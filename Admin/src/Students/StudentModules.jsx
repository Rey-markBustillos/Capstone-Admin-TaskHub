import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarContext from '../contexts/SidebarContext';
import { StudentThemeContext } from '../contexts/StudentThemeContext';
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

// ✅ Remove trailing slash
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const StudentModules = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { isSidebarOpen } = useContext(SidebarContext);
  const { isLightMode } = useContext(StudentThemeContext);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('StudentModules component mounted');
    console.log('ClassId from params:', classId);
    console.log('API_BASE_URL:', API_BASE_URL);
  }, [classId]);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = `${API_BASE_URL}/modules?classId=${classId}`;
      console.log('📋 Fetching modules from:', apiUrl);
      const response = await axios.get(apiUrl);
      console.log('📋 Modules received:', response.data);
      // ✅ Log each module's cloudinaryUrl
      response.data.forEach(mod => {
        console.log(`📄 Module: ${mod.title}, Cloudinary URL: ${mod.cloudinaryUrl}`);
      });
      setModules(response.data || []);
    } catch (err) {
      console.error('❌ Error fetching modules:', err);
      console.error('❌ Error details:', err.response?.data);
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
    const iconClass = "text-xl sm:text-3xl";
    
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

  const handleView = async (module) => {
    try {
      console.log('👀 Viewing module:', module.title);
      console.log('👀 Module data:', {
        cloudinaryUrl: module.cloudinaryUrl,
        viewerUrl: module.viewerUrl,
        fileName: module.fileName,
        publicId: module.publicId
      });
      
      if (!module || !module._id) {
        alert('Invalid module');
        return;
      }
      
      // Priority 1: Use viewerUrl if available
      if (module.viewerUrl) {
        console.log('✅ Opening viewer URL:', module.viewerUrl);
        window.open(module.viewerUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      
      // Priority 2: Use cloudinaryUrl if available
      if (module.cloudinaryUrl) {
        console.log('✅ Opening Cloudinary URL:', module.cloudinaryUrl);
        const fileExtension = module.fileName.split('.').pop().toLowerCase();
        
        if (fileExtension === 'pdf') {
          // For PDFs, open directly
          window.open(module.cloudinaryUrl, '_blank', 'noopener,noreferrer');
        } else {
          // For other documents, use Google Docs Viewer
          const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(module.cloudinaryUrl)}&embedded=true`;
          window.open(googleDocsUrl, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      
      // Priority 3: Try to construct Cloudinary URL from publicId
      if (module.publicId) {
        console.log('🔧 Constructing URL from publicId:', module.publicId);
        const cloudName = 'dptg3ct9i';
        const fileExtension = module.fileName.split('.').pop().toLowerCase();
        const constructedUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${module.publicId}.${fileExtension}`;
        console.log('✅ Constructed URL:', constructedUrl);

        if (fileExtension === 'pdf') {
          window.open(constructedUrl, '_blank', 'noopener,noreferrer');
        } else {
          const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(constructedUrl)}&embedded=true`;
          window.open(googleDocsUrl, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      
      // Priority 4: Fallback to backend view route
      console.log('⚠️ Using fallback backend route');
      const viewUrl = `${API_BASE_URL}/modules/view/${module._id}`;
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
      
    } catch (err) {
      console.error('❌ View error:', err);
      alert(`Failed to open module: ${err.message}`);
    }
  };

  const handleDownload = async (module) => {
    try {
      console.log('📥 Downloading module:', module.title);
      
      // Priority 1: Use cloudinaryUrl if available
      if (module.cloudinaryUrl) {
        console.log('✅ Downloading from Cloudinary:', module.cloudinaryUrl);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = module.cloudinaryUrl;
        link.download = module.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Download initiated');
        return;
      }
      
      // Priority 2: Try to construct Cloudinary URL from publicId (download)
      if (module.publicId) {
        console.log('🔧 Constructing download URL from publicId:', module.publicId);
        const cloudName = 'dptg3ct9i';
        const fileExtension = module.fileName.split('.').pop().toLowerCase();
        const downloadUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${module.publicId}.${fileExtension}`;

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = module.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('✅ Download initiated from constructed URL');
        return;
      }
      
      // Priority 3: Fallback to backend download route
      console.log('⚠️ Using fallback backend download route');
      const downloadUrl = `${API_BASE_URL}/modules/download/${module._id}`;
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      
    } catch (err) {
      console.error('❌ Download error:', err);
      alert(`Failed to download module: ${err.message}`);
    }
  };

  return (
    <div className={`min-h-screen p-2 sm:p-4 space-y-3 sm:space-y-6 transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'ml-10 sm:ml-12 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'}`}>
      <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate(`/student/class/${classId}`)}
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-lg text-xs sm:text-base"
      >
        <FaArrowLeft className="text-xs sm:text-sm" />
        Back to Class Menu
      </button>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-6 rounded-lg shadow-lg">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <FaBook className="text-yellow-300 text-base sm:text-xl" />
          Learning Modules
        </h1>
        <p className="text-blue-100 text-xs sm:text-base">Access course materials and resources uploaded by your teacher</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-2 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-base">
          <FaExclamationTriangle className="text-red-500" />
          {error}
        </div>
      )}

      <div className={`${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-lg shadow-lg border`}>
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <FaSpinner className="animate-spin text-xl sm:text-3xl text-blue-500 mr-2 sm:mr-3" />
            <span className={`text-sm sm:text-lg ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>Loading modules...</span>
          </div>
        ) : modules.length === 0 ? (
          <div className={`text-center py-8 sm:py-12 ${isLightMode ? 'text-gray-500' : 'text-gray-400'} px-2`}>
            <FaBook className="text-4xl sm:text-6xl mb-3 sm:mb-4 mx-auto opacity-50" />
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">No Modules Available</h3>
            <p className="text-sm sm:text-base">Your teacher hasn't uploaded any learning modules yet.</p>
          </div>
        ) : (
          <div className={`divide-y ${isLightMode ? 'divide-gray-200' : 'divide-gray-600'}`}>
            {modules.map((module) => (
              <div
                key={module._id}
                className={`p-2 sm:p-3 md:p-6 ${isLightMode ? 'hover:bg-gray-50' : 'hover:bg-gray-700'} transition-colors`}
              >
                <div className="flex items-start gap-1 sm:gap-2 md:gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(module.fileName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs sm:text-sm md:text-lg lg:text-xl font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'} mb-0.5 sm:mb-1 md:mb-2`}>
                      {module.title}
                    </h3>
                    
                    {module.description && (
                      <p className={`${isLightMode ? 'text-gray-600' : 'text-gray-300'} mb-1 sm:mb-2 md:mb-3 line-clamp-2 text-[10px] sm:text-xs md:text-base`}>
                        {module.description}
                      </p>
                    )}
                    
                    <div className={`flex flex-wrap items-center gap-1 sm:gap-2 md:gap-4 text-[10px] sm:text-xs md:text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <FaFileAlt className="text-[8px] sm:text-xs" />
                        <span>{module.fileName}</span>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <FaCalendarAlt className="text-[8px] sm:text-xs" />
                        <span>Uploaded: {new Date(module.uploadDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <FaUser className="text-[8px] sm:text-xs" />
                        <span>By: {module.uploadedBy?.name || 'Teacher'}</span>
                      </div>
                      <div>
                        <span>Size: {formatFileSize(module.fileSize)}</span>
                      </div>
                      {/* ✅ Show cloud storage indicator */}
                      {module.cloudinaryUrl && (
                        <div className="flex items-center gap-0.5 sm:gap-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1 sm:px-2 py-0.5 rounded" title="Stored in cloud">
                          <span>☁️</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 md:gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleView(module)}
                      className="flex items-center gap-0.5 sm:gap-1 md:gap-2 px-1 sm:px-2 md:px-4 py-0.5 sm:py-1 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md sm:rounded-lg transition-colors font-medium text-[10px] sm:text-xs md:text-base"
                      title="View Module"
                    >
                      <FaEye className="text-[8px] sm:text-xs md:text-sm" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      onClick={() => handleDownload(module)}
                      className="flex items-center gap-0.5 sm:gap-1 md:gap-2 px-1 sm:px-2 md:px-4 py-0.5 sm:py-1 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-md sm:rounded-lg transition-colors font-medium text-[10px] sm:text-xs md:text-base"
                      title="Download Module"
                    >
                      <FaDownload className="text-[8px] sm:text-xs md:text-sm" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modules.length > 0 && (
        <div className={`${isLightMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'} p-2 sm:p-4 rounded-lg border`}>
          <div className={`flex items-center justify-between text-xs sm:text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
            <span>Total modules: {modules.length}</span>
            <span>Total size: {formatFileSize(modules.reduce((total, module) => total + module.fileSize, 0))}</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default StudentModules;