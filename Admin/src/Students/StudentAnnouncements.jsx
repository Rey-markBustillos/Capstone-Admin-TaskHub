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
    <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-2 sm:p-4 pb-8 transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'ml-10 sm:ml-12 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'}`}>
      <div className="w-full max-w-none mx-auto min-h-screen px-1 sm:px-2 md:px-4 lg:px-6">
        <div className="mb-4 sm:mb-6 mt-2 sm:mt-4">
          <NavLink
            to={`/student/class/${classId}`}
            className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg bg-indigo-600 text-white font-medium shadow-sm hover:bg-indigo-700 transition mb-2 sm:mb-4"
          >
            <FaArrowLeft className="text-xs sm:text-sm" /> <span className="hidden xs:inline sm:inline">Back to Class Menu</span><span className="xs:hidden sm:hidden">Back</span>
          </NavLink>
        </div>
        <div className="w-full max-w-none pb-6">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <FaBullhorn className="text-base sm:text-xl lg:text-2xl text-indigo-300" />
              <span className="hidden sm:inline">Announcements</span>
              <span className="sm:hidden">News</span>
            </h1>
          </div>

          {/* Main Content - No Height Restriction */}
          <div className={`transition-all duration-300 ${viewersInfo.isOpen ? 'blur-sm pointer-events-none' : ''}`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh]">
                <FaBullhorn className="animate-bounce text-indigo-400 mb-4" size={48} />
                <p className="text-center text-lg text-gray-300">Loading announcements...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh]">
                <FaTimes className="text-red-500 mb-4" size={48} />
                <p className="text-center text-red-500">{error}</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-indigo-500/30 p-8 text-gray-300">
                <FaBullhorn className="mx-auto mb-4 text-indigo-400" size={36} />
                <p>No announcements posted yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => {
                  const reactionCounts = getReactionCounts(ann.reactions);
                  const isCommentsOpen = openComments[ann._id];

                  return (
                  <div
                    key={ann._id}
                    ref={announcementCardRef}
                    data-ann-id={ann._id}
                    className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-indigo-100 dark:border-indigo-900 overflow-hidden"
                  >
                    <div className="p-2 sm:p-3 md:p-4 lg:p-6">
                      <h2 className="text-sm sm:text-lg md:text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
                        <FaBullhorn className="mr-1 sm:mr-2 text-xs sm:text-base" /> {ann.title}
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 whitespace-pre-line leading-relaxed text-xs sm:text-sm md:text-base">{ann.content}</p>
                      
                      {/* Display attachments if any */}
                      {ann.attachments && ann.attachments.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                            <FaFileUpload className="inline mr-1" />
                            Attached Files ({ann.attachments.length})
                          </p>
                          <div className="space-y-3">
                            {ann.attachments.map((attachment, index) => {
                              // Handle different file URL scenarios
                              let fileUrl;
                              let cloudinaryUrl = attachment.cloudinaryUrl;
                              
                              // If no cloudinaryUrl but filename looks like Cloudinary public_id, construct URL
                              if (!cloudinaryUrl && attachment.filename && attachment.filename.includes('taskhub/')) {
                                // This is a Cloudinary file without saved URL - construct it
                                const cloudName = 'drvtezcke'; // Your Cloudinary cloud name
                                const resourceType = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.originalName) ? 'image' : 'raw';
                                cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${attachment.filename}`;
                                console.log('🔧 Constructed Cloudinary URL:', cloudinaryUrl);
                              }
                              
                              // Use Cloudinary URL if available, fallback to local file URL for legacy files
                              fileUrl = cloudinaryUrl || `${API_BASE_URL}/announcements/files/${attachment.filename}`;
                              const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.originalName);
                              // Only images will have preview, other files are download-only
                              
                              return (
                                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {attachment.originalName}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
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
                                        className="text-blue-500 hover:text-blue-400 p-1"
                                        title="Download file"
                                      >
                                        <FaDownload />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Display content based on file type */}
                                  {isImage && (
                                    <div className="mt-2">
                                      <img 
                                        src={fileUrl} 
                                        alt={attachment.originalName}
                                        className="max-w-full h-auto rounded-lg shadow-md max-h-32 sm:max-h-48 md:max-h-64 lg:max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                        loading="lazy"
                                        onClick={() => window.open(fileUrl, '_blank')}
                                        title="Click to view full size"
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Only images have preview, other files are download-only */}
                                  {!isImage && (
                                    <div className="mt-2 p-3 bg-white dark:bg-gray-600 rounded border text-center">
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
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

                      <div className="pt-3 mt-4 text-xs sm:text-sm flex items-center gap-2">
                        <FaUserCircle className="text-indigo-400" />
                        <span className="text-gray-500 dark:text-gray-400">
                          Posted by: <span className="font-medium">{ann.postedBy?.name || 'Teacher'}</span> on {(() => {
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

                    <div className="px-4 sm:px-6 pt-2 pb-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-y-4">
                      <div className="flex items-center gap-2">
                        {availableReactions.map(emoji => {
                          const userHasReacted = ann.reactions?.some(r => r.user?._id === userId && r.emoji === emoji);
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(ann._id, emoji)}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 text-lg ${userHasReacted ? 'bg-indigo-500/30 scale-110' : 'hover:bg-gray-700'}`}
                              title={emoji}
                            >
                              <span>{emoji}</span>
                              {reactionCounts[emoji] > 0 && (
                                <span className="text-xs font-bold text-gray-300">{reactionCounts[emoji]}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-center">
                        <button
                          onClick={() => openViewersModal(ann)}
                          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium py-1 px-2 sm:px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-sm"
                        >
                          <FaEye />
                          <span>{ann.viewedBy?.length || 0}</span>
                          <span className="hidden sm:inline">Views</span>
                        </button>
                        <button
                          onClick={() => toggleComments(ann._id)}
                          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium py-1 px-2 sm:px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-sm"
                        >
                          <FaCommentAlt />
                          <span>{ann.comments?.length || 0}</span>
                          <span className="hidden sm:inline">Comments</span>
                        </button>
                      </div>
                    </div>

                    {isCommentsOpen && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 sm:px-6 py-4 border-t border-indigo-100 dark:border-indigo-900 animate-fadeIn">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                          <FaCommentAlt className="text-indigo-400" /> Comments
                        </h4>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {ann.comments?.length > 0 ? ann.comments.map(comment => (
                            <div key={comment._id} className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-800 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                                {comment.postedBy?.name?.charAt(0).toUpperCase() || <FaUserCircle />}
                              </div>
                              <div>
                                <p className="text-sm">
                                  <span className="font-bold text-gray-900 dark:text-white">{comment.postedBy?.name || 'User'}</span>
                                  <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">
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
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{comment.text}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
                          )}
                        </div>
                        <form onSubmit={(e) => handleCommentSubmit(e, ann._id)} className="mt-4 flex gap-3">
                          <input
                            type="text"
                            value={commentInputs[ann._id] || ''}
                            onChange={(e) => handleCommentChange(ann._id, e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          />
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-2 rounded-lg flex items-center justify-center px-4"
                            disabled={!commentInputs[ann._id] || !commentInputs[ann._id].trim()}
                          >
                            <FaPaperPlane />
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

        {/* Viewers Modal */}
        {viewersInfo.isOpen && (
          <div
            className="fixed inset-0 flex justify-center items-end sm:items-center z-50"
            onClick={() => setViewersInfo({ isOpen: false, viewers: [], title: '' })}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-md relative transition-transform duration-300 ease-out transform translate-y-full animate-slide-up"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-2 sm:p-3 md:p-4 lg:p-6">
                <div className="flex justify-between items-center mb-2 sm:mb-4">
                  <h3 className="text-sm sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <FaEye className="text-indigo-400" /> Viewed By
                  </h3>
                  <button
                    onClick={() => setViewersInfo({ isOpen: false, viewers: [], title: '' })}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <FaTimes size={16} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-4 truncate">For: "{viewersInfo.title}"</p>
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {viewersInfo.viewers.length > 0 ? viewersInfo.viewers.map(viewer => (
                    <li key={viewer._id} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md">
                      <FaUserCircle className="text-indigo-400" /> {viewer.name}
                    </li>
                  )) : (
                    <li className="text-gray-500 dark:text-gray-400 text-center py-4">No one has viewed this announcement yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}