import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5000';

export default function StudentActivitySubmission({ classId, studentId }) {
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [errorActivities, setErrorActivities] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Debug log to check classId prop
  useEffect(() => {
    console.log('Received classId prop:', classId);
  }, [classId]);

  // Fetch activities for the class
  useEffect(() => {
    if (!classId) {
      setActivities([]);
      return;
    }

    const fetchActivities = async () => {
      setLoadingActivities(true);
      setErrorActivities('');
      try {
        const res = await fetch(`${API_BASE}/api/activities?classId=${classId}`);
        if (!res.ok) throw new Error('Failed to fetch activities');
        const data = await res.json();
        console.log('Fetched activities:', data); // Debug log here
        setActivities(data);
      } catch (err) {
        setErrorActivities(err.message || 'Something went wrong');
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [classId]);

  // Open submission modal
  const openSubmitModal = (activity) => {
    setSelectedActivity(activity);
    setSubmissionFile(null);
    setSubmissionMessage('');
    setModalOpen(true);
  };

  // Close submission modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedActivity(null);
    setSubmissionFile(null);
    setSubmissionMessage('');
  };

  // Handle submission upload
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!submissionFile) {
      setSubmissionMessage('Please upload a file before submitting.');
      return;
    }

    // Convert classId to string to avoid type mismatch
    if (
      !selectedActivity ||
      selectedActivity.classId.toString() !== classId.toString()
    ) {
      setSubmissionMessage('Invalid activity selected.');
      return;
    }

    setSubmitting(true);
    setSubmissionMessage('');

    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('activityId', selectedActivity._id);
    formData.append('submissionFile', submissionFile);

    try {
      const res = await fetch(`${API_BASE}/api/submissions`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to submit activity');

      setSubmissionMessage('Activity submitted successfully!');
      setSubmissionFile(null);
      // Optionally close modal after submission:
      // closeModal();
    } catch (err) {
      setSubmissionMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-430 bg-[#FFDAB9] p-6 flex justify-center items-start">
      <div className="max-w-4xl w-full bg-white rounded shadow p-6">
        <h2 className="text-3xl font-semibold mb-6 text-gray-900">Class Activities</h2>

        {loadingActivities && <p className="text-center p-4">Loading activities...</p>}
        {errorActivities && <p className="text-center p-4 text-red-600">{errorActivities}</p>}
        {!loadingActivities && activities.length === 0 && (
          <p className="text-center text-gray-900 p-4">No activities available for this class.</p>
        )}

        <ul className="space-y-6 mb-6">
          {activities.map((activity) => (
            <li
              key={activity._id}
              className="p-6 border rounded shadow-sm hover:shadow-md transition flex justify-between items-start"
            >
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">{activity.title}</h3>
                {activity.instructions && (
                  <p className="text-gray-700 mb-3 whitespace-pre-line">{activity.instructions}</p>
                )}
                <p className="text-sm text-gray-600 mb-1">
                  Deadline: {new Date(activity.deadline).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 font-medium mb-2">Points: {activity.points}</p>
                {activity.attachedFile && (
                  <a
                    href={`${API_BASE}/uploads/${activity.attachedFile.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 text-yellow-600 hover:text-yellow-800 underline"
                  >
                    View Attachment
                  </a>
                )}
              </div>
              <div>
                <button
                  onClick={() => openSubmitModal(activity)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-semibold transition"
                >
                  Submit
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 relative">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                Submit Activity: {selectedActivity?.title}
              </h2>

              <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Upload your submission <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                    onChange={(e) => setSubmissionFile(e.target.files[0])}
                    className="w-full border border-gray-300 rounded-md p-2 text-gray-900"
                    required
                  />
                </div>

                {submissionMessage && (
                  <p
                    className={`mb-4 ${
                      submissionMessage.toLowerCase().includes('success')
                        ? 'text-green-600'
                        : 'text-red-600'
                    } font-semibold`}
                  >
                    {submissionMessage}
                  </p>
                )}

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold transition"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Activity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
