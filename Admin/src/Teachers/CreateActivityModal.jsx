import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000";

const CreateActivityModal = ({
  isOpen,
  onClose,
  activityToEdit = null,
  activityForm,
  setActivityForm,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (activityToEdit) {
      setActivityForm({
        title: activityToEdit.title || "",
        instructions: activityToEdit.instructions || "",
        deadline: activityToEdit.deadline
          ? activityToEdit.deadline.slice(0, 10)
          : "",
        classId: activityToEdit.classId || "",
        className: activityToEdit.className || "",
        points: activityToEdit.points || 0,
        attachedFile: null,
      });
    } else {
      setActivityForm({
        title: "",
        instructions: "",
        deadline: "",
        classId: "",
        className: "",
        points: 0,
        attachedFile: null,
      });
    }
  }, [activityToEdit, setActivityForm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-[#FFDAB9] bg-opacity-60 z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 relative">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">
          {activityToEdit ? "Update Activity" : "Create Activity"}
        </h2>

        {error && (
          <p className="text-red-600 mb-6 border border-red-300 bg-red-100 rounded p-3">
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            Promise.resolve(onSubmit(e)).finally(() => setLoading(false));
          }}
          encType="multipart/form-data"
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={activityForm.title}
              onChange={(e) =>
                setActivityForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900"
              placeholder="Enter activity title"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Instructions
            </label>
            <textarea
              value={activityForm.instructions}
              onChange={(e) =>
                setActivityForm((prev) => ({
                  ...prev,
                  instructions: e.target.value,
                }))
              }
              rows={4}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900"
              placeholder="Enter instructions (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Deadline <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              value={activityForm.deadline}
              onChange={(e) =>
                setActivityForm((prev) => ({ ...prev, deadline: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Class ID
            </label>
            <input
              type="text"
              value={activityForm.classId}
              readOnly
              className="w-full border border-gray-300 rounded-md p-3 bg-gray-100 cursor-not-allowed text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Class Name
            </label>
            <input
              type="text"
              value={activityForm.className}
              readOnly
              className="w-full border border-gray-300 rounded-md p-3 bg-gray-100 cursor-not-allowed text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Points
            </label>
            <input
              type="number"
              value={activityForm.points}
              min={0}
              onChange={(e) =>
                setActivityForm((prev) => ({ ...prev, points: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900"
              placeholder="Enter points"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Upload File
            </label>
            <input
              type="file"
              onChange={(e) =>
                setActivityForm((prev) => ({
                  ...prev,
                  attachedFile: e.target.files[0],
                }))
              }
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
              className="w-full text-gray-900"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition disabled:opacity-50"
            >
              {loading
                ? activityToEdit
                  ? "Updating..."
                  : "Creating..."
                : activityToEdit
                ? "Update Activity"
                : "Create Activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateActivityModal;
