import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import SidebarContext from '../contexts/SidebarContext';
import axios from 'axios';
import { 
  FaBook, 
  FaDownload, 
  FaEye,
  FaSpinner,
  FaExclamationTriangle,
  FaFileAlt,
  FaCalendarAlt,
  FaUser
} from 'react-icons/fa';

// ✅ Remove trailing slash
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const StudentModules = () => {
  const { classId } = useParams();
  const { isSidebarOpen } = useContext(SidebarContext);
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
    <div className={`min-h-screen overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 transition-all duration-300 pt-28 sm:pt-32 md:pt-36 w-full ${isSidebarOpen ? 'md:ml-36 lg:ml-44 md:w-[calc(100%-144px)] lg:w-[calc(100%-176px)]' : 'md:ml-10 lg:ml-12 md:w-[calc(100%-40px)] lg:w-[calc(100%-48px)]'}`}>
      <div className="w-full">

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-xl shadow-lg border-l-4 border-blue-400">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-3 mb-2">
          <FaBook className="text-yellow-300 text-2xl sm:text-3xl" />
          Learning Modules
        </h1>
        <p className="text-blue-100 text-sm sm:text-base">Access course materials and resources uploaded by your teacher</p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm sm:text-base shadow-sm">
          <FaExclamationTriangle className="text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <FaSpinner className="animate-spin text-2xl sm:text-3xl text-blue-500 mr-3" />
            <span className="text-base sm:text-lg text-gray-700 font-medium">Loading modules...</span>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12 sm:py-16 text-gray-500 px-4">
            <FaBook className="text-5xl sm:text-6xl mb-4 mx-auto opacity-40 text-blue-300" />
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-700">No Modules Available</h3>
            <p className="text-sm sm:text-base">Your teacher hasn't uploaded any learning modules yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-blue-100">
            {modules.map((module) => (
              <div
                key={module._id}
                className="p-4 sm:p-5 md:p-6 hover:bg-blue-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(module.fileName)}
                  </div>

                  <div className="flex-1 min-w-0 w-full">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-blue-900 mb-2 break-words">
                      {module.title}
                    </h3>
                    
                    {module.description && (
                      <p className="text-gray-600 mb-3 text-sm sm:text-base break-words">
                        {module.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1.5">
                        <FaFileAlt className="text-blue-500 flex-shrink-0" />
                        <span className="truncate max-w-[200px] sm:max-w-none">{module.fileName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FaCalendarAlt className="text-blue-500 flex-shrink-0" />
                        <span>Uploaded: {new Date(module.uploadDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FaUser className="text-blue-500 flex-shrink-0" />
                        <span>By: {module.uploadedBy?.name || 'Teacher'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Size: {formatFileSize(module.fileSize)}</span>
                      </div>
                      {module.cloudinaryUrl && (
                        <div className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-2 py-1 rounded-md" title="Stored in cloud">
                          <span>☁️ Cloud</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => handleView(module)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm shadow-md hover:shadow-lg min-h-[44px]"
                      title="View Module"
                    >
                      <FaEye />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleDownload(module)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold text-sm shadow-md hover:shadow-lg min-h-[44px]"
                      title="Download Module"
                    >
                      <FaDownload />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modules.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm sm:text-base text-gray-700 font-medium">
            <span>Total modules: <span className="font-bold text-blue-600">{modules.length}</span></span>
            <span>Total size: <span className="font-bold text-blue-600">{formatFileSize(modules.reduce((total, module) => total + module.fileSize, 0))}</span></span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default StudentModules;