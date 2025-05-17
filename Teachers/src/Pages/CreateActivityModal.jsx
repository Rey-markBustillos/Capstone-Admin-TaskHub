import React from "react";

const CreateActivityModal = ({
  showModal,
  closeModal,
  activityForm,
  handleActivityFormChange,
  handleActivitySubmit,
  editingActivity,
}) => {
  return (
    showModal && (
      <div className="fixed inset-0 bg-[#FFDAB9] bg-opacity-50 flex justify-center items-center z-50">
        <div
          className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-lg"
          style={{ color: "#000" }}
        >
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl"
            onClick={closeModal}
          >
            ✕
          </button>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: "#000" }}>
            {editingActivity ? "Update Activity" : "Create Activity"}
          </h2>
          <form onSubmit={handleActivitySubmit} className="space-y-4" encType="multipart/form-data">
            <div>
              <label className="block font-semibold mb-1" style={{ color: "#000" }}>
                Activity Title *
              </label>
              <input
                type="text"
                value={activityForm.title}
                onChange={(e) => handleActivityFormChange("title", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
                style={{ color: "#000" }}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: "#000" }}>
                Instructions
              </label>
              <textarea
                value={activityForm.instructions}
                onChange={(e) => handleActivityFormChange("instructions", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
                style={{ color: "#000" }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1" style={{ color: "#000" }}>
                  Deadline *
                </label>
                <input
                  type="date"
                  value={activityForm.deadline}
                  onChange={(e) => handleActivityFormChange("deadline", e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                  style={{ color: "#000" }}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1" style={{ color: "#000" }}>
                  Class *
                </label>
                <input
                  type="text"
                  value={activityForm.className}
                  readOnly
                  className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 cursor-not-allowed"
                  style={{ color: "#000" }}
                />
              </div>
            </div>

            {/* New Points input */}
            <div>
              <label className="block font-semibold mb-1" style={{ color: "#000" }}>
                Points
              </label>
              <input
                type="number"
                min={0}
                value={activityForm.points || ""}
                onChange={(e) => handleActivityFormChange("points", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                style={{ color: "#000" }}
              />
            </div>

            {/* New Attach File input */}
            <div>
              <label className="block font-semibold mb-1" style={{ color: "#000" }}>
                Attach File
              </label>
              <input
                type="file"
                onChange={(e) => handleActivityFormChange("attachedFile", e.target.files[0])}
                className="w-full border border-gray-300 rounded px-3 py-2 cursor-pointer"
                style={{ color: "#000" }}
              />
            </div>

            <div className="mt-6 flex space-x-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded"
              >
                {editingActivity ? "Update Activity" : "Create Activity"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="bg-gray-400 text-white font-semibold px-6 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
};

export default CreateActivityModal;
