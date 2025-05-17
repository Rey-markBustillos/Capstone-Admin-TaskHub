import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/activities";

const defaultActivity = {
  title: "",
  instructions: "",
  deadline: "",
  class: "",
  subject: "",
  gradeLevel: "",
  submissionGuidelines: {
    allowedFileTypes: "",
    maxFileSizeMB: "",
  },
};

const ActivityManagement = () => {
  const [activities, setActivities] = useState([]);
  const [editingActivity, setEditingActivity] = useState(null);
  const [form, setForm] = useState(defaultActivity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE);
      setActivities(res.data);
      setError(null);
    } catch {
      setError("Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.deadline || !form.class || !form.subject || !form.gradeLevel) {
      alert("Please fill out all required fields");
      return;
    }
    setLoading(true);
    try {
      if (editingActivity) {
        await axios.put(`${API_BASE}/${editingActivity._id}`, form);
        setEditingActivity(null);
      } else {
        await axios.post(API_BASE, form);
      }
      setForm(defaultActivity);
      fetchActivities();
      setError(null);
    } catch (err) {
      alert(err.response?.data?.message || "Error saving activity");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchActivities();
      setError(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete activity");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setForm(activity);
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
    setForm(defaultActivity);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-center">Activity Management</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 mb-8 rounded shadow space-y-4 border border-gray-300"
      >
        <h2 className="text-xl font-semibold">{editingActivity ? "Edit Activity" : "Create New Activity"}</h2>

        <input
          type="text"
          placeholder="Title *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          placeholder="Instructions"
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            placeholder="Deadline *"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Class *"
            value={form.class}
            onChange={(e) => setForm({ ...form, class: e.target.value })}
            className="px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Subject *"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Grade Level *"
            value={form.gradeLevel}
            onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
            className="px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <h3 className="font-semibold mt-4">Submission Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Allowed file types (e.g., pdf, docx, jpg)"
            value={form.submissionGuidelines.allowedFileTypes}
            onChange={(e) =>
              setForm({
                ...form,
                submissionGuidelines: { ...form.submissionGuidelines, allowedFileTypes: e.target.value },
              })
            }
            className="px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Max file size (MB)"
            value={form.submissionGuidelines.maxFileSizeMB}
            onChange={(e) =>
              setForm({
                ...form,
                submissionGuidelines: { ...form.submissionGuidelines, maxFileSizeMB: e.target.value },
              })
            }
            className="px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>

        <div className="flex space-x-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            {editingActivity ? "Update Activity" : "Create Activity"}
          </button>
          {editingActivity && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 border-collapse">
          <thead className="bg-gray-100">
            <tr>
              {["Title", "Class", "Subject", "Grade Level", "Deadline", "Actions"].map((heading) => (
                <th
                  key={heading}
                  className="border border-gray-300 px-4 py-2 text-left"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-4">
                  No activities found.
                </td>
              </tr>
            )}
            {activities.map((activity) => (
              <tr key={activity._id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{activity.title}</td>
                <td className="border border-gray-300 px-4 py-2">{activity.class}</td>
                <td className="border border-gray-300 px-4 py-2">{activity.subject}</td>
                <td className="border border-gray-300 px-4 py-2">{activity.gradeLevel}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {new Date(activity.deadline).toLocaleDateString()}
                </td>
                <td className="border border-gray-300 px-4 py-2 space-x-2">
                  <button
                    onClick={() => handleEdit(activity)}
                    className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this activity?")) {
                        handleDelete(activity._id);
                      }
                    }}
                    className="bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityManagement;
