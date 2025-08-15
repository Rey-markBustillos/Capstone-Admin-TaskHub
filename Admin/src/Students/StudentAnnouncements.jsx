import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { FaBullhorn, FaPaperPlane, FaCommentAlt, FaEye } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5000/api';

export default function StudentAnnouncements() {
  const { classId } = useParams();
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

  const availableReactions = ['👍', '❤️', '😂', '😮', '😢'];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                Announcements
            </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${viewersInfo.isOpen ? 'blur-sm pointer-events-none' : ''} transition-all duration-300`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? <p className="text-center text-lg">Loading...</p> : error ? <p className="text-center text-red-500">{error}</p> : announcements.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8text-gray-800 dark:text-gray-100">
              <p>No announcements posted yet.</p>
            </div>
          ) : (
            <ul className="space-y-8">
              {announcements.map((ann) => {
                const reactionCounts = getReactionCounts(ann.reactions);
                const isCommentsOpen = openComments[ann._id];

                return (
                  <li key={ann._id} ref={announcementCardRef} data-ann-id={ann._id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center">
                        <FaBullhorn className="mr-3" /> {ann.title}
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-line leading-relaxed">{ann.content}</p>
                      <div className="pt-3 mt-4 text-sm">
                        <p className="text-gray-500 dark:text-gray-400">
                          Posted by: <span className="font-medium">{ann.postedBy?.name || 'Teacher'}</span> on {new Date(ann.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="px-6 pt-2 pb-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-y-2">
                      <div className="flex items-center gap-2">
                        {availableReactions.map(emoji => {
                          const userHasReacted = ann.reactions?.some(r => r.user?._id === userId && r.emoji === emoji);
                          return (
                            <button key={emoji} onClick={() => handleReaction(ann._id, emoji)} className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 text-lg ${userHasReacted ? 'bg-indigo-100 dark:bg-indigo-500/30 scale-110' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                              <span>{emoji}</span>
                              {reactionCounts[emoji] > 0 && <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{reactionCounts[emoji]}</span>}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => openViewersModal(ann)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium py-1 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                          <FaEye />
                          <span>{ann.viewedBy?.length || 0} Views</span>
                        </button>
                        <button onClick={() => toggleComments(ann._id)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium py-1 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                          <FaCommentAlt />
                          <span>{ann.comments?.length || 0} Comments</span>
                        </button>
                      </div>
                    </div>

                    {isCommentsOpen && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Comments</h4>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                          {ann.comments?.length > 0 ? ann.comments.map(comment => (
                            <div key={comment._id} className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-800 flex-shrink-0 flex items-center justify-center text-white font-bold">
                                {comment.postedBy?.name.charAt(0).toUpperCase()}
                              </div>
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
                          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-2 rounded-lg flex items-center justify-center px-4" disabled={!commentInputs[ann._id] || !commentInputs[ann._id].trim()}>
                            <FaPaperPlane />
                          </button>
                        </form>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Viewers Modal */}
      {viewersInfo.isOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 p-4" onClick={() => setViewersInfo({ isOpen: false, viewers: [], title: '' })}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Viewed By</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">For: "{viewersInfo.title}"</p>
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {viewersInfo.viewers.length > 0 ? viewersInfo.viewers.map(viewer => (
                <li key={viewer._id} className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md">{viewer.name}</li>
              )) : (
                <li className="text-gray-500 dark:text-gray-400">No one has viewed this announcement yet.</li>
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