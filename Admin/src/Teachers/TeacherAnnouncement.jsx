import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar'; // Import Navbar

const API_BASE = 'http://localhost:5000/api/announcements';

export default function TeacherAnnouncement() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?._id;

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for create/edit
  const [form, setForm] = useState({
    title: '',
    content: '',
    id: null, // null means new, otherwise editing
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      setAnnouncements(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      if (form.id) {
        // Update existing
        await axios.put(`${API_BASE}/${form.id}`, {
          title: form.title,
          content: form.content,
        });
      } else {
        // Create new
        await axios.post(API_BASE, {
          title: form.title,
          content: form.content,
          postedBy: userId,
        });
      }
      setForm({ title: '', content: '', id: null });
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleEdit = (ann) => {
    setForm({ title: ann.title, content: ann.content, id: ann._id });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <Navbar /> {/* Add Navbar here */}
      <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
        <h1 className="text-3xl font-bold mb-6 text-center">Teacher Announcements</h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <div className="mb-4">
            <label className="block font-semibold mb-1" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="Announcement Title"
            />
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1" htmlFor="content">
              Content
            </label>
            <textarea
              id="content"
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="Announcement Content"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            {form.id ? 'Update Announcement' : 'Create Announcement'}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm({ title: '', content: '', id: null })}
              className="ml-4 px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </form>

        {/* Announcement List */}
        {loading ? (
          <p className="text-center text-lg">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p className="text-center text-gray-600">No announcements available.</p>
        ) : (
          <ul className="space-y-6">
            {announcements.map((ann) => (
              <li
                key={ann._id}
                className="border border-gray-200 rounded p-4 shadow-sm bg-gray-50"
              >
                <h2 className="text-xl font-semibold mb-1">{ann.title}</h2>
                <p className="mb-2 whitespace-pre-line">{ann.content}</p>
                <p className="text-gray-600 text-sm mb-3">
                  Posted by: {ann.postedBy?.name || 'Unknown'} on{' '}
                  {new Date(ann.datePosted).toLocaleDateString()}
                </p>
                <div>
                  <button
                    onClick={() => handleEdit(ann)}
                    className="text-blue-600 mr-4 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ann._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}