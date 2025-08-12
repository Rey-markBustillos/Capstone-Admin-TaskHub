import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../Css/teacherannouncement.css';
import { FaPlus, FaEdit, FaTrashAlt, FaPaperPlane, FaCommentAlt, FaEye } from 'react-icons/fa';

const API_BASE = 'http://localhost:5000/api';

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

  // Ref para sa IntersectionObserver at para maiwasan ang multiple calls sa isang session
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
      const [announcementsRes, classRes] = await Promise.all([
        axios.get(`${API_BASE}/announcements?classId=${classId}`),
        axios.get(`${API_BASE}/class/${classId}`)
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markAsViewed = useCallback(async (announcementId) => {
    // Huwag i-mark as viewed kung nagawa na sa session na ito
    if (viewedInSessionRef.current.has(announcementId)) return;
    
    // Alamin kung ang user ay nasa listahan na ng viewedBy
    const announcement = announcements.find(ann => ann._id === announcementId);
    const alreadyViewed = announcement?.viewedBy.some(viewer => viewer._id === userId);

    if (alreadyViewed) {
        viewedInSessionRef.current.add(announcementId);
        return;
    }

    viewedInSessionRef.current.add(announcementId);
    try {
      const res = await axios.post(`${API_BASE}/announcements/${announcementId}/view`, { userId });
      updateAnnouncementInState(res.data);
    } catch (err) {
      console.error("Failed to mark as viewed:", err);
      // Itago ang error sa user para hindi intrusive
    }
  }, [userId, announcements]); // Idinagdag ang 'announcements' sa dependency array

  const announcementCardRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const annId = entry.target.dataset.annId;
          if (annId) {
            markAsViewed(annId);
          }
        }
      });
    }, { threshold: 0.5 }); // Itrigger kapag 50% ng card ay visible

    if (node) observer.current.observe(node);
  }, [loading, markAsViewed]);


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
      const res = await axios.post(`${API_BASE}/announcements/${announcementId}/comments`, { text, postedBy: userId });
      updateAnnouncementInState(res.data);
      setCommentInputs(prev => ({ ...prev, [announcementId]: '' }));
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Could not post comment.");
    }
  };

  const handleReaction = async (announcementId, emoji) => {
    try {
      const res = await axios.post(`${API_BASE}/announcements/${announcementId}/reactions`, { emoji, userId });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const { title, content } = e.target.elements;
    if (!title.value.trim() || !content.value.trim()) {
      setError('Title and content are required');
      return;
    }
    try {
      const payload = { title: title.value, content: content.value, postedBy: userId, classId };
      if (form.id) {
        await axios.put(`${API_BASE}/announcements/${form.id}`, payload);
      } else {
        await axios.post(`${API_BASE}/announcements`, payload);
      }
      setForm({ title: '', content: '', id: null });
      fetchData();
      setIsModalOpen(false);
    } catch (err)      {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleEdit = (ann) => {
    setForm({ title: ann.title, content: ann.content, id: ann._id });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API_BASE}/announcements/${id}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const openModalForCreate = () => {
    setForm({ title: '', content: '', id: null });
    setError(null);
    setIsModalOpen(true);
  };

  const openViewersModal = (ann) => {
    setViewersInfo({ isOpen: true, viewers: ann.viewedBy || [], title: ann.title });
  };

  const availableReactions = ['👍', '❤️', '😂', '😮', '😢'];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
            Announcements for <span className="text-indigo-600 dark:text-indigo-400">{className}</span>
          </h1>
          <button onClick={openModalForCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center" aria-label="Create New Announcement">
            <FaPlus className="mr-2 h-5 w-5" /> New Announcement
          </button>
        </div>

        <div className={`${isModalOpen || viewersInfo.isOpen ? 'blur-sm pointer-events-none' : ''} transition-all duration-300`}>
          {loading ? <p className="text-center text-lg">Loading...</p> : error && announcements.length === 0 ? <p className="text-center text-red-500">{error}</p> : !loading && announcements.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              <p>No announcements posted yet.</p>
            </div>
          ) : (
            <ul className="space-y-8">
              {announcements.map((ann) => {
                const reactionCounts = getReactionCounts(ann.reactions);
                const isCommentsOpen = openComments[ann._id];

                return (
                  <li key={ann._id} ref={announcementCardRef} data-ann-id={ann._id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
                    <div className="p-6">
                      <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{ann.title}</h2>
                      <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-line leading-relaxed">{ann.content}</p>
                      <div className="pt-3 mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm">
                        <p className="text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
                          Posted by: <span className="font-medium">{ann.postedBy?.name || 'You'}</span> on {new Date(ann.datePosted).toLocaleDateString()}
                        </p>
                        <div className="flex space-x-3">
                          <button onClick={() => handleEdit(ann)} className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-1 px-3 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"><FaEdit className="mr-1.5 h-4 w-4" /> Edit</button>
                          <button onClick={() => handleDelete(ann._id)} className="flex items-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium py-1 px-3 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><FaTrashAlt className="mr-1.5 h-4 w-4" /> Delete</button>
                        </div>
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
                          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-2 rounded-lg flex items-center justify-center px-4">
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg relative">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{form.id ? 'Edit' : 'Create'} Announcement</h2>
            <form onSubmit={handleSubmit}>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input type="text" id="title" name="title" defaultValue={form.title} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                <textarea id="content" name="content" defaultValue={form.content} rows="5" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" required ></textarea>
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">{form.id ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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