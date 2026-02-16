import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import axios from 'axios';
import { useParams, NavLink } from 'react-router-dom';
import { FaBullhorn, FaPaperPlane, FaCommentAlt, FaEye, FaTimes, FaUserCircle, FaRegSmile, FaRegSadTear, FaRegLaughBeam, FaRegHeart, FaRegSurprise, FaArrowLeft, FaFileUpload, FaDownload } from 'react-icons/fa';
import { availableReactions } from '../constants/reactions';
import SidebarContext from '../contexts/SidebarContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

export default function StudentAnnouncements() {
  const { classId } = useParams();
  const { isSidebarOpen } = useContext(SidebarContext);
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?._id;

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [viewersInfo, setViewersInfo] = useState({ isOpen: false, viewers: [], title: '' });

  const observer = useRef();
  const viewedInSessionRef = useRef(new Set());

  const fetchData = useCallback(async () => {
    if (!userId || !classId) {
      setError("User or Class not identified.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/announcements?classId=${classId}`);
      setAnnouncements(res.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch announcements.");
    } finally {
      setLoading(false);
    }
  }, [userId, classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateAnnouncementInState = (updatedAnnouncement) => {
    setAnnouncements(prev => prev.map(ann => ann._id === updatedAnnouncement._id ? updatedAnnouncement : ann));
  };

  const markAsViewed = useCallback(async (announcementId) => {
    if (viewedInSessionRef.current.has(announcementId)) return;
    const announcement = announcements.find(ann => ann._id === announcementId);
    if (announcement?.viewedBy.some(viewer => viewer._id === userId)) {
      viewedInSessionRef.current.add(announcementId);
      return;
    }
    viewedInSessionRef.current.add(announcementId);
    try {
      const res = await axios.post(`${API_BASE_URL}/announcements/${announcementId}/view`, { userId });
      updateAnnouncementInState(res.data);
    } catch (err) {
      console.error("Failed to mark as viewed:", err);
    }
  }, [userId, announcements]);

  const announcementCardRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const annId = entry.target.dataset.annId;
          if (annId) markAsViewed(annId);
        }
      });
    }, { threshold: 0.5 });
    if (node) observer.current.observe(node);
  }, [loading, markAsViewed]);

  const toggleComments = (announcementId) => {
    setOpenComments(prev => ({ ...prev, [announcementId]: !prev[announcementId] }));
  };

  const handleCommentChange = (announcementId, text) => {
    setCommentInputs(prev => ({ ...prev, [announcementId]: text }));
  };

  const handleCommentSubmit = async (e, announcementId) => {
    e.preventDefault();
    const text = commentInputs[announcementId];
    if (!text || !text.trim() || !user) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/announcements/${announcementId}/comments`, { text, postedBy: userId });
      updateAnnouncementInState(res.data);
      setCommentInputs(prev => ({ ...prev, [announcementId]: '' }));
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Could not post comment.");
    }
  };

  const downloadFile = (filename, originalName) => {
    const downloadUrl = `${API_BASE_URL}/announcements/attachment/${filename}?download=true`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReaction = async (announcementId, emoji) => {
    if (!user) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/announcements/${announcementId}/reactions`, { emoji, userId });
      updateAnnouncementInState(res.data);
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
      alert("Could not react.");
    }
  };

  const getReactionCounts = (reactions) => (reactions || []).reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {});

  const openViewersModal = (ann) => {
    setViewersInfo({ isOpen: true, viewers: ann.viewedBy || [], title: ann.title });
  };

  // ...availableReactions imported from shared constants...

  return (
    <div className={`min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-28 sm:pt-32 md:pt-36 pb-8 sm:pb-12 md:pb-16 px-3 sm:px-4 md:px-6 transition-all duration-300 ${
      isSidebarOpen ? 'md:ml-36 lg:ml-44 md:w-[calc(100%-144px)] lg:w-[calc(100%-176px)]' : 'md:ml-10 lg:ml-12 md:w-[calc(100%-40px)] lg:w-[calc(100%-48px)]'
    }`}>
      <div className="w-full max-w-5xl mx-auto">
        <div className="mb-4 sm:mb-6 mt-2">
        </div>
        <div className="w-full">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-900 flex items-center gap-2 sm:gap-3">
              <FaBullhorn className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-blue-600" />
              <span>Announcements</span>
            </h1>
          </div>

          {/* Main Content */}
          <div className={`transition-all duration-300 ${viewersInfo.isOpen ? 'blur-sm pointer-events-none' : ''}`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] py-8 sm:py-12">
                <FaBullhorn className="animate-bounce text-blue-400 mb-4" size={40} />
                <p className="text-center text-base sm:text-lg text-gray-700">Loading announcements...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] py-8 sm:py-12">
                <FaTimes className="text-red-500 mb-4" size={40} />
                <p className="text-center text-red-600 text-sm sm:text-base px-4">{error}</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8 sm:py-12 md:py-16 bg-white border-blue-200 text-gray-700 backdrop-blur-sm rounded-xl shadow-md border-2 p-6 sm:p-8">
                <FaBullhorn className="mx-auto mb-4 text-blue-400" size={48} />
                <p className="text-sm sm:text-base md:text-lg">No announcements posted yet.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {announcements.map((ann) => {
                  const reactionCounts = getReactionCounts(ann.reactions);
                  const isCommentsOpen = openComments[ann._id];

                  return (
                  <div
                    key={ann._id}
                    ref={announcementCardRef}
                    data-ann-id={ann._id}
                    className="bg-white border-blue-200 shadow-lg hover:shadow-xl rounded-xl border-2 overflow-hidden transition-shadow duration-200"
                  >
                    <div className="p-4 sm:p-5 md:p-6">
                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-600 mb-3 sm:mb-4 flex items-center gap-2">
                        <FaBullhorn className="text-sm sm:text-base md:text-lg flex-shrink-0" /> 
                        <span className="line-clamp-2 break-words">{ann.title}</span>
                      </h2>
                      <p className="text-gray-700 mb-4 sm:mb-5 whitespace-pre-line leading-relaxed text-sm sm:text-base">{ann.content}</p>
                      
                      {/* Display attachments if any */}
                      {ann.attachments && ann.attachments.length > 0 && (
                        <div className="mb-4 sm:mb-5">
                          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                            <FaFileUpload className="text-sm flex-shrink-0" />
                            <span>Attached Files ({ann.attachments.length})</span>
                          </p>
                          <div className="space-y-2 sm:space-y-3">
                            {ann.attachments.map((attachment, index) => {
                              // Handle different file URL scenarios
                              let fileUrl;
                              let cloudinaryUrl = attachment.cloudinaryUrl;
                              
                              // If no cloudinaryUrl but filename looks like Cloudinary public_id, construct URL
                              if (!cloudinaryUrl && attachment.filename && attachment.filename.includes('taskhub/')) {
                                // This is a Cloudinary file without saved URL - construct it
                                const cloudName = 'dptg3ct9i'; // Correct Cloudinary cloud name
                                
                                // Try to determine resource type, but have fallback options
                                let resourceType = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.originalName) ? 'image' : 'raw';
                                cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${attachment.filename}`;
                                
                                // Store both possible URLs for fallback
                                attachment._fallbackUrl = resourceType === 'image' 
                                  ? `https://res.cloudinary.com/${cloudName}/raw/upload/${attachment.filename}`
                                  : `https://res.cloudinary.com/${cloudName}/image/upload/${attachment.filename}`;
                                
                                console.log('🔧 Constructed Cloudinary URL:', cloudinaryUrl);
                                console.log('🔧 Fallback URL:', attachment._fallbackUrl);
                              }
                              
                              // Use Cloudinary URL if available, fallback to local file URL for legacy files
                              fileUrl = cloudinaryUrl || `${API_BASE_URL}/announcements/files/${attachment.filename}`;
                              const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.originalName);
                              // Only images will have preview, other files are download-only
                              
                              return (
                                <div key={index} className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-gray-700 break-all line-clamp-2">
                                      {attachment.originalName}
                                    </span>
                                    <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-center">
                                      <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {(attachment.fileSize / 1024 / 1024).toFixed(1)}MB
                                      </span>
                                      <button
                                        onClick={() => {
                                          console.log('🔽 Download clicked for:', attachment.originalName);
                                          console.log('🔽 Cloudinary URL:', cloudinaryUrl);
                                          console.log('🔽 Original Cloudinary URL:', attachment.cloudinaryUrl);
                                          console.log('🔽 Filename:', attachment.filename);
                                          
                                          // Use Cloudinary URL for direct download, or legacy download endpoint
                                          if (cloudinaryUrl) {
                                            try {
                                              // Method 1: Try direct Cloudinary download
                                              const downloadUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
                                              console.log('🔽 Using Cloudinary download URL:', downloadUrl);
                                              
                                              const link = document.createElement('a');
                                              link.href = downloadUrl;
                                              link.download = attachment.originalName;
                                              link.target = '_blank';
                                              link.rel = 'noopener noreferrer';
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                              
                                              // Fallback method: Use backend download route
                                              setTimeout(() => {
                                                // Try backend route as fallback
                                                const backendDownloadUrl = `${API_BASE_URL}/announcements/download/${ann._id}/${index}`;
                                                console.log('🔄 Fallback: Using backend download route:', backendDownloadUrl);
                                                
                                                const fallbackLink = document.createElement('a');
                                                fallbackLink.href = backendDownloadUrl;
                                                fallbackLink.download = attachment.originalName;
                                                fallbackLink.target = '_blank';
                                                fallbackLink.rel = 'noopener noreferrer';
                                              }, 1000);
                                            } catch (error) {
                                              console.error('❌ Cloudinary download error:', error);
                                              // Final fallback: open in new tab
                                              window.open(cloudinaryUrl, '_blank', 'noopener,noreferrer');
                                            }
                                          } else {
                                            console.log('🔽 Using legacy download method');
                                            downloadFile(attachment.filename, attachment.originalName);
                                          }
                                        }}
                                        className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-100 rounded transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                                        title="Download file"
                                      >
                                        <FaDownload className="text-base sm:text-lg" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Display content based on file type */}
                                  {isImage && (
                                    <div className="mt-2">
                                      <img 
                                        src={fileUrl} 
                                        alt={attachment.originalName}
                                        className="max-w-full h-auto rounded-lg shadow-md max-h-40 sm:max-h-56 md:max-h-72 lg:max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                        loading="lazy"
                                        onClick={() => window.open(fileUrl, '_blank')}
                                        title="Click to view full size"
                                        onError={(e) => {
                                          console.log('🖼️ Image load error in StudentAnnouncements:', attachment.originalName);
                                          
                                          // Prevent infinite retry loops
                                          if (e.target.getAttribute('data-retry-attempted') === 'true') {
                                            console.log('⚠️ Already retried, showing placeholder');
                                            e.target.style.display = 'none';
                                            return;
                                          }
                                          
                                          e.target.setAttribute('data-retry-attempted', 'true');
                                          
                                          // Try fallback URL if available
                                          if (attachment._fallbackUrl && !e.target.getAttribute('data-fallback-tried')) {
                                            console.log('🔄 Trying fallback Cloudinary URL:', attachment._fallbackUrl);
                                            e.target.setAttribute('data-fallback-tried', 'true');
                                            e.target.src = attachment._fallbackUrl;
                                            return;
                                          }
                                          
                                          // Hide image and show placeholder
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Only images have preview, other files are download-only */}
                                  {!isImage && (
                                    <div className="mt-2 p-3 bg-white rounded border border-blue-200 text-center">
                                      <p className="text-sm text-gray-600">
                                        Click download to view this file
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 sm:pt-4 mt-4 border-t-2 border-blue-100 text-xs sm:text-sm flex items-center gap-2">
                        <FaUserCircle className="text-blue-500 text-base sm:text-lg flex-shrink-0" />
                        <span className="text-gray-500 truncate">
                          <span className="font-medium">{ann.postedBy?.name || 'Teacher'}</span> • {(() => {
                            const dateToUse = ann.createdAt || ann.date || new Date().toISOString();
                            const dateObj = new Date(dateToUse);
                            
                            if (dateObj && !isNaN(dateObj.getTime())) {
                              return `${dateObj.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })} at ${dateObj.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}`;
                            } else {
                              const now = new Date();
                              return `${now.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })} at ${now.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}`;
                            }
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-t-2 border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                        {availableReactions.map(emoji => {
                          const userHasReacted = ann.reactions?.some(r => r.user?._id === userId && r.emoji === emoji);
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(ann._id, emoji)}
                              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-full transition-all duration-200 text-base sm:text-lg min-w-[40px] min-h-[40px] ${userHasReacted ? 'bg-blue-500/30 scale-110' : 'hover:bg-blue-50 border border-blue-200'}`}
                              title={emoji}
                            >
                              <span>{emoji}</span>
                              {reactionCounts[emoji] > 0 && (
                                <span className="text-xs font-bold text-gray-600">{reactionCounts[emoji]}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center w-full sm:w-auto justify-end">
                        <button
                          onClick={() => openViewersModal(ann)}
                          className="flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 text-xs sm:text-sm min-h-[44px] border-2 border-blue-200 hover:border-blue-400"
                        >
                          <FaEye className="text-sm flex-shrink-0" />
                          <span className="font-bold">{ann.viewedBy?.length || 0}</span>
                          <span className="hidden sm:inline">Views</span>
                        </button>
                        <button
                          onClick={() => toggleComments(ann._id)}
                          className="flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 text-xs sm:text-sm min-h-[44px] border-2 border-blue-200 hover:border-blue-400"
                        >
                          <FaCommentAlt className="text-sm flex-shrink-0" />
                          <span className="font-bold">{ann.comments?.length || 0}</span>
                          <span className="hidden sm:inline">Comments</span>
                        </button>
                      </div>
                    </div>

                    {isCommentsOpen && (
                      <div className="bg-blue-50 px-4 sm:px-5 md:px-6 py-4 sm:py-5 border-t-2 border-blue-200 animate-fadeIn">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm sm:text-base">
                          <FaCommentAlt className="text-blue-600 text-sm flex-shrink-0" /> Comments ({ann.comments?.length || 0})
                        </h4>
                        <div className="space-y-3 sm:space-y-4 max-h-60 sm:max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                          {ann.comments?.length > 0 ? ann.comments.map(comment => (
                            <div key={comment._id} className="flex items-start gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-200 text-blue-700 flex-shrink-0 flex items-center justify-center font-bold text-xs sm:text-sm">
                                {comment.postedBy?.name?.charAt(0).toUpperCase() || <FaUserCircle />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm mb-1">
                                  <span className="font-bold text-gray-900">{comment.postedBy?.name || 'User'}</span>
                                  <span className="text-gray-500 ml-2 text-[10px] sm:text-xs">
                                    {(() => {
                                      const dateToUse = comment.createdAt || comment.date || new Date().toISOString();
                                      const dateObj = new Date(dateToUse);
                                      
                                      if (dateObj && !isNaN(dateObj.getTime())) {
                                        return `${dateObj.toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric'
                                        })} at ${dateObj.toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        })}`;
                                      } else {
                                        const now = new Date();
                                        return `${now.toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric'
                                        })} at ${now.toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        })}`;
                                      }
                                    })()}
                                  </span>
                                </p>
                                <p className="text-gray-700 text-xs sm:text-sm break-words">{comment.text}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-xs sm:text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                          )}
                        </div>
                        <form onSubmit={(e) => handleCommentSubmit(e, ann._id)} className="mt-4 flex gap-2 sm:gap-3">
                          <input
                            type="text"
                            value={commentInputs[ann._id] || ''}
                            onChange={(e) => handleCommentChange(ann._id, e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 min-w-0 border-2 border-blue-300 rounded-lg px-3 py-2 sm:py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                          />
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center justify-center px-4 sm:px-5 min-h-[44px] transition-all shadow-md hover:shadow-lg"
                            disabled={!commentInputs[ann._id] || !commentInputs[ann._id].trim()}
                          >
                            <FaPaperPlane className="text-sm" />
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>

        {/* Viewers Modal */}
        {viewersInfo.isOpen && (
          <div
            className="fixed inset-0 flex justify-center items-end sm:items-center z-50 bg-black/40 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setViewersInfo({ isOpen: false, viewers: [], title: '' })}
          >
            <div
              className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md md:max-w-lg max-h-[85vh] sm:max-h-[75vh] relative transition-transform duration-300 ease-out transform animate-slide-up overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 md:p-6">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaEye className="text-blue-600 text-lg sm:text-xl flex-shrink-0" /> Viewed By
                  </h3>
                  <button
                    onClick={() => setViewersInfo({ isOpen: false, viewers: [], title: '' })}
                    className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 line-clamp-2 break-words">For: "{viewersInfo.title}"</p>
                <div className="max-h-[55vh] sm:max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  <ul className="space-y-2 sm:space-y-3">
                    {viewersInfo.viewers.length > 0 ? viewersInfo.viewers.map(viewer => (
                      <li key={viewer._id} className="flex items-center gap-3 text-gray-700 bg-blue-50 hover:bg-blue-100 p-3 rounded-lg transition-colors">
                        <FaUserCircle className="text-blue-600 text-lg sm:text-xl flex-shrink-0" /> 
                        <span className="text-sm sm:text-base font-medium truncate">{viewer.name}</span>
                      </li>
                    )) : (
                      <li className="text-xs sm:text-sm text-gray-500 text-center py-8">No one has viewed this announcement yet.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}