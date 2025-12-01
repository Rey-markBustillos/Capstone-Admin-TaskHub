
// ...existing imports and code...
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrashAlt, FaPaperPlane, FaCommentAlt, FaEye, FaBullhorn, FaFileUpload, FaDownload, FaTimes } from 'react-icons/fa';
import { availableReactions } from '../constants/reactions';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function TeacherAnnouncement() {
  const { classId } = useParams();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?._id;

  const [announcements, setAnnouncements] = useState([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', id: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [viewersInfo, setViewersInfo] = useState({ isOpen: false, viewers: [], title: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Removed view tracking refs since teachers don't need to track their own announcement views


  const fetchData = useCallback(async () => {
    if (!userId || !classId) {
      setError("User or Class not identified.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [announcementsRes, classRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/announcements?classId=${classId}`),
        axios.get(`${API_BASE_URL}/class/${classId}`)
      ]);
      setAnnouncements(announcementsRes.data);
      setClassName(classRes.data.className);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, [userId, classId]);


  // Removed markAsViewed function since teachers don't need to mark their own announcements as viewed

  // Teachers don't need to mark their own announcements as viewed automatically
  // Only students should mark announcements as viewed when they actually view them

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Teachers don't need intersection observer to mark their own announcements as viewed
  // Only students should use intersection observer for view tracking

  const toggleComments = (announcementId) => {
    setOpenComments(prev => ({ ...prev, [announcementId]: !prev[announcementId] }));
  };

  const updateAnnouncementInState = (updatedAnnouncement) => {
    setAnnouncements(prev => prev.map(ann => ann._id === updatedAnnouncement._id ? updatedAnnouncement : ann));
  };

  const handleCommentChange = (announcementId, text) => {
    setCommentInputs(prev => ({ ...prev, [announcementId]: text }));
  };

  const handleCommentSubmit = async (e, announcementId) => {
    e.preventDefault();
    const text = commentInputs[announcementId];
    if (!text || !text.trim()) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/announcements/${announcementId}/comments`, { text, postedBy: userId });
      updateAnnouncementInState(res.data);
      setCommentInputs(prev => ({ ...prev, [announcementId]: '' }));
    } catch {
      alert("Could not post comment.");
    }
  };

  const handleReaction = async (announcementId, emoji) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/announcements/${announcementId}/reactions`, { emoji, userId });
      updateAnnouncementInState(res.data);
    } catch {
      alert("Could not react.");
    }
  };

  const getReactionCounts = (reactions) => (reactions || []).reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const { title, content } = e.target.elements;
    if (!title.value.trim() || !content.value.trim()) {
      setError('Title and content are required');
      return;
    }
    if (!userId) {
      setError('User information not found. Please log in again.');
      return;
    }
    if (!classId) {
      setError('Class information not found.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', title.value);
      formData.append('content', content.value);
      formData.append('postedBy', userId);
      formData.append('classId', classId);
      
      // Add selected files
      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      if (form.id) {
        // For updates, we'll use regular JSON for now (file updates can be added later)
        const payload = { title: title.value, content: content.value, postedBy: userId, classId };
        await axios.put(`${API_BASE_URL}/announcements/${form.id}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/announcements`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      setForm({ title: '', content: '', id: null });
      setSelectedFiles([]);
      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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

  const handleEdit = (ann) => {
    setForm({ title: ann.title, content: ann.content, id: ann._id });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/announcements/${id}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const openModalForCreate = () => {
    setForm({ title: '', content: '', id: null });
    setSelectedFiles([]);
    setError(null);
    setIsModalOpen(true);
  };

  const openViewersModal = (annId) => {
    const ann = announcements.find(a => a._id === annId);
    setViewersInfo({ isOpen: true, viewers: ann?.viewedBy || [], title: ann?.title || '' });
  };

  // ...availableReactions imported from shared constants...

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 px-2 sm:px-6">
      {/* Header Section with Icon */}
      <div className="flex items-center justify-between mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg px-6 py-5 border border-indigo-100 dark:border-indigo-900">
        <div className="flex items-center gap-4">
          <FaBullhorn className="text-yellow-300 text-4xl drop-shadow-lg animate-pulse" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 drop-shadow">Announcements for <span className="text-yellow-200">{className}</span></h1>
        </div>
        <button onClick={openModalForCreate} className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 dark:text-gray-900 font-bold py-3 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center" aria-label="Create New Announcement">
          <FaPlus className="mr-2 h-5 w-5" /> New Announcement
        </button>
      </div>

      <div className={`${isModalOpen || viewersInfo.isOpen ? 'blur-sm pointer-events-none' : ''} transition-all duration-300`}>
        {loading ? <p className="text-center text-lg text-gray-800 dark:text-gray-300">Loading...</p> : error && announcements.length === 0 ? <p className="text-center text-red-400">{error}</p> : !loading && announcements.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 flex flex-col items-center justify-center gap-4">
            <FaBullhorn className="text-yellow-300 text-4xl mb-2 animate-bounce" />
            <p className="text-lg text-gray-800 dark:text-gray-300">No announcements posted yet.</p>
          </div>
        ) : (
          <div className="max-h-screen overflow-y-auto pr-2">
            <ul className="space-y-8">
              {announcements.map((ann) => {
              const reactionCounts = getReactionCounts(ann.reactions);
              const isCommentsOpen = openComments[ann._id];

              return (
                <li key={ann._id} data-ann-id={ann._id} className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-indigo-100 dark:border-indigo-900 overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FaBullhorn className="text-yellow-300 text-xl" />
                      <h2 className="text-xl sm:text-2xl font-bold text-indigo-700 dark:text-yellow-100 mb-0 drop-shadow">{ann.title}</h2>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-line leading-relaxed text-base">{ann.content}</p>
                    
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
                            
                            // Debug logging
                            console.log('📎 Attachment debug:', {
                              originalName: attachment.originalName,
                              cloudinaryUrl: cloudinaryUrl,
                              filename: attachment.filename,
                              finalUrl: fileUrl,
                              isImage: isImage,
                              isConstructedUrl: !attachment.cloudinaryUrl && attachment.filename && attachment.filename.includes('taskhub/')
                            });
                            
                            // Check if this is a legacy file without Cloudinary URL
                            const isLegacyFile = !cloudinaryUrl && attachment.filename;
                            

                            
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
                                        console.log('🔽 Cloudinary URL:', attachment.cloudinaryUrl);
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
                                
                                {/* Display image preview directly */}
                                {isImage && !isLegacyFile && (
                                  <div className="mt-2">
                                    <img 
                                      src={fileUrl} 
                                      alt={attachment.originalName}
                                      className="w-full h-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                                      style={{ 
                                        maxHeight: '300px',
                                        objectFit: 'cover',
                                        display: 'block'
                                      }}
                                      onError={(e) => {
                                        console.log('🖼️ Image load error:', attachment.originalName, 'URL:', e.target.src);
                                        console.log('🔍 Has Cloudinary URL:', !!attachment.cloudinaryUrl);
                                        
                                        // Prevent infinite retry loops
                                        if (e.target.getAttribute('data-retry-attempted') === 'true') {
                                          console.log('⚠️ Already retried, showing placeholder');
                                          return;
                                        }
                                        
                                        e.target.setAttribute('data-retry-attempted', 'true');
                                        
                                        // If we have a Cloudinary URL and it failed, try fallback URL
                                        if (cloudinaryUrl && fileUrl === cloudinaryUrl) {
                                          if (attachment._fallbackUrl && !e.target.getAttribute('data-fallback-tried')) {
                                            console.log('🔄 Trying fallback Cloudinary URL:', attachment._fallbackUrl);
                                            e.target.setAttribute('data-fallback-tried', 'true');
                                            e.target.src = attachment._fallbackUrl;
                                            return;
                                          }
                                          
                                          console.log('❌ Cloudinary URL failed, showing placeholder');
                                          e.target.style.display = 'none';
                                          if (!e.target.parentNode.querySelector('.error-placeholder')) {
                                            const placeholder = document.createElement('div');
                                            placeholder.className = 'error-placeholder bg-gray-200 dark:bg-gray-600 p-8 rounded-lg text-center';
                                            placeholder.innerHTML = `
                                              <div class="text-gray-400 text-4xl mb-2">🖼️</div>
                                              <p class="text-gray-600 dark:text-gray-400 text-sm">Image not available</p>
                                              <p class="text-gray-500 dark:text-gray-500 text-xs mt-1">${attachment.originalName}</p>
                                            `;
                                            e.target.parentNode.appendChild(placeholder);
                                          }
                                        } else if (!cloudinaryUrl) {
                                          // For legacy files, try alternative URL pattern
                                          const fallbackUrl = `${API_BASE_URL}/announcements/attachment/${attachment.filename}`;
                                          console.log('🔄 Trying fallback URL:', fallbackUrl);
                                          e.target.src = fallbackUrl;
                                        } else {
                                          // Show error placeholder
                                          e.target.style.display = 'none';
                                          if (!e.target.parentNode.querySelector('.error-placeholder')) {
                                            const placeholder = document.createElement('div');
                                            placeholder.className = 'error-placeholder bg-gray-200 dark:bg-gray-600 p-8 rounded-lg text-center';
                                            placeholder.innerHTML = `
                                              <div class="text-gray-400 text-4xl mb-2">🖼️</div>
                                              <p class="text-gray-600 dark:text-gray-400 text-sm">Image not available</p>
                                              <p class="text-gray-500 dark:text-gray-500 text-xs mt-1">${attachment.originalName}</p>
                                            `;
                                            e.target.parentNode.appendChild(placeholder);
                                          }
                                        }
                                      }}
                                      onLoad={() => {
                                        console.log('✅ Image loaded successfully:', attachment.originalName);
                                      }}
                                      onClick={() => {
                                        // Open full size in new tab
                                        window.open(fileUrl, '_blank');
                                      }}
                                      title="Click to view full size"
                                    />
                                  </div>
                                )}
                                
                                {/* Legacy files - show notice that they need to be re-uploaded */}
                                {isLegacyFile && isImage && (
                                  <div className="mt-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-yellow-600 dark:text-yellow-400 text-2xl">⚠️</span>
                                      <span className="text-yellow-800 dark:text-yellow-200 font-medium">Legacy File</span>
                                    </div>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                      This file was uploaded before our cloud storage upgrade and may not be available after server restarts.
                                    </p>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                      <strong>To fix:</strong> Delete this announcement and create a new one with the same file for permanent storage.
                                    </p>
                                  </div>
                                )}

                                {/* PDF and other documents - download only */}
                                
                                {/* Video files - download only */}
                                
                                {/* Audio files - download only */}
                                
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

                    <div className="pt-3 mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs sm:text-sm">
                      <p className="text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
                        Posted by: <span className="font-semibold text-yellow-200">{ann.postedBy?.name || 'You'}</span> on {new Date(ann.datePosted).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-3">
                        <button onClick={() => handleEdit(ann)} className="flex items-center text-blue-400 hover:text-blue-200 font-medium py-1 px-3 rounded-md hover:bg-blue-900/30 transition-colors"><FaEdit className="mr-1.5 h-4 w-4" /> Edit</button>
                        <button onClick={() => handleDelete(ann._id)} className="flex items-center text-red-500 hover:text-red-300 font-medium py-1 px-3 rounded-md hover:bg-red-900/30 transition-colors"><FaTrashAlt className="mr-1.5 h-4 w-4" /> Delete</button>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pt-2 pb-4 border-t border-indigo-100 dark:border-indigo-900 flex items-center justify-between flex-wrap gap-y-2">
                    <div className="flex items-center gap-2">
                      {availableReactions.map(emoji => {
                        const userHasReacted = ann.reactions?.some(r => r.user?._id === userId && r.emoji === emoji);
                        return (
                          <button key={emoji} onClick={() => handleReaction(ann._id, emoji)} className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 text-lg ${userHasReacted ? 'bg-indigo-500/30 scale-110' : 'hover:bg-gray-700 dark:hover:bg-gray-700'}`}>
                            <span>{emoji}</span>
                            {reactionCounts[emoji] > 0 && <span className="text-xs font-bold text-gray-300">{reactionCounts[emoji]}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => openViewersModal(ann._id)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-yellow-300 font-medium py-1 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                        <FaEye />
                        <span>{ann.viewedBy?.length || 0} Views</span>
                      </button>
                      <button onClick={() => toggleComments(ann._id)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-yellow-300 font-medium py-1 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                        <FaCommentAlt />
                        <span>{ann.comments?.length || 0} Comments</span>
                      </button>
                    </div>
                  </div>
                  {isCommentsOpen && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 px-6 py-4 border-t border-indigo-100 dark:border-indigo-900 animate-fadeIn">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Comments</h4>
                      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                        {ann.comments?.length > 0 ? ann.comments.map(comment => (
                          <div key={comment._id} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-800 flex-shrink-0"></div>
                            <div>
                              <p className="text-sm">
                                <span className="font-bold text-gray-900 dark:text-white">{comment.postedBy?.name || 'User'}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">{new Date(comment.date).toLocaleDateString()}</span>
                              </p>
                              <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
                            </div>
                          </div>
                        )) : <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>}
                      </div>
                      <form onSubmit={(e) => handleCommentSubmit(e, ann._id)} className="mt-4 flex gap-3">
                        <input
                          type="text"
                          value={commentInputs[ann._id] || ''}
                          onChange={(e) => handleCommentChange(ann._id, e.target.value)}
                          placeholder="Write a comment..."
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 dark:text-gray-900 font-semibold p-2 rounded-lg flex items-center justify-center px-4">
                          <FaPaperPlane />
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              );
              })}
            </ul>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg relative border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-100">{form.id ? 'Edit' : 'Create'} Announcement</h2>
            <form onSubmit={handleSubmit}>
              {error && <p className="text-red-400 mb-4">{error}</p>}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input type="text" id="title" name="title" defaultValue={form.title} className="w-full border border-gray-600 rounded-lg p-2.5 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                <textarea id="content" name="content" defaultValue={form.content} rows="5" className="w-full border border-gray-600 rounded-lg p-2.5 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" required ></textarea>
              </div>
              
              {/* File Upload Section */}
              {!form.id && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <FaFileUpload className="inline mr-2" />
                    Attach Files (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="w-full border border-gray-600 rounded-lg p-2.5 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.mp3,.zip,.rar"
                  />
                  <p className="text-xs text-gray-400 mt-1">Max 10MB per file. Allowed: images (JPG, PNG, GIF), documents (PDF, Word, PowerPoint), videos, audio, archives</p>
                </div>
              )}

              {/* Selected Files Display */}
              {selectedFiles.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-300 mb-2">Selected Files:</p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                        <span className="text-sm text-gray-300 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">{form.id ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewersInfo.isOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 p-4" onClick={() => setViewersInfo({ isOpen: false, viewers: [], title: '' })}>
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md relative border border-gray-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-gray-100">Viewed By</h3>
            <p className="text-sm text-gray-400 mb-4 truncate">For: "{viewersInfo.title}"</p>
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {Array.isArray(viewersInfo.viewers) && viewersInfo.viewers.length > 0 ? viewersInfo.viewers.map(viewer => (
                <li key={viewer._id || viewer.name} className="text-gray-300 bg-gray-700/50 p-2 rounded-md">{viewer.name}</li>
              )) : (
                <li className="text-gray-400">No one has viewed this announcement yet.</li>
              )}
            </ul>
            <button onClick={() => setViewersInfo({ isOpen: false, viewers: [], title: '' })} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}