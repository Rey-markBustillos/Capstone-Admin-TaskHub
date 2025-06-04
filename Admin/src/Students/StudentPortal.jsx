import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import '../Css/StudentPortal.css';

const StudentPortal = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user && user.role === 'student' ? user._id : null;
  const role = user?.role || 'student';
  const [activeClass, setActiveClass] = useState(null);

  // Disable background scroll when modal is open
  useEffect(() => {
    if (selectedClass || selectedActivity) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedClass, selectedActivity]);

  useEffect(() => {
    if (!studentId) {
      setError('Student not logged in');
      setLoading(false);
      return;
    }
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/classes?studentId=${studentId}`);
        setClasses(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [studentId]);

  useEffect(() => {
    if (!selectedClass) {
      setActivities([]);
      setActivitiesError(null);
      return;
    }
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      setActivitiesError(null);
      try {
        const res = await axios.get(`http://localhost:5000/api/activities?classId=${selectedClass._id}`);
        setActivities(res.data);
      } catch (err) {
        setActivitiesError(err.response?.data?.message || err.message);
      } finally {
        setActivitiesLoading(false);
      }
    };
    fetchActivities();
  }, [selectedClass]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadError('');
    setUploadSuccess('');
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (!selectedActivity) {
      setUploadError('No activity selected.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', selectedClass._id);
    formData.append('createdBy', studentId);
    formData.append('title', selectedActivity.title);
    formData.append('date', new Date().toISOString());

    setUploading(true);
    try {
      await axios.post('http://localhost:5000/api/activities/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess('File uploaded successfully!');
      setFile(null);

      const res = await axios.get(`http://localhost:5000/api/activities?classId=${selectedClass._id}`);
      setActivities(res.data);

      setSelectedActivity(null);
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p>Loading your classes...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (classes.length === 0) return <p>You are not enrolled in any classes.</p>;

  const FallingBooksAnimation = () => (
    <>
      <div className="falling-book" style={{ left: '5vw', animationDuration: '7s', animationDelay: '0s' }}>📚</div>
      <div className="falling-book" style={{ left: '20vw', animationDuration: '9s', animationDelay: '2s' }}>📚</div>
      <div className="falling-book" style={{ left: '35vw', animationDuration: '6s', animationDelay: '4s' }}>📚</div>
      <div className="falling-book" style={{ left: '50vw', animationDuration: '8s', animationDelay: '1s' }}>📚</div>
      <div className="falling-book" style={{ left: '65vw', animationDuration: '10s', animationDelay: '3s' }}>📚</div>
      <div className="falling-book" style={{ left: '80vw', animationDuration: '7.5s', animationDelay: '5s' }}>📚</div>
      <div className="falling-book" style={{ left: '90vw', animationDuration: '8.5s', animationDelay: '6s' }}>📚</div>
    </>
  );

  return (
    <>
      {/* Main page falling books background */}
      <div className="app-background" aria-hidden="true">
        <FallingBooksAnimation />
      </div>

      <div style={{ display: 'flex' }}>
        <Sidebar
          role={role}
          onLogout={() => {
            localStorage.removeItem('user');
            window.location.reload();
          }}
        />

        <main
          className="container mx-auto py-6 px-4 md:px-6 lg:px-8"
          style={{
            display: 'flex',
            flexDirection: 'row',
            marginLeft: '0',
            minHeight: '100vh',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div className="w-full relative z-10">
            <h1 className="text-3xl font-semibold text-gray-100 mb-6">Your Enrolled Classes</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {classes.map((cls) => (
                <div
                  key={cls._id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition duration-300 ease-in-out ${activeClass === cls._id ? 'bg-lightblue' : ''} class-box`}
                  onClick={() => {
                    setSelectedClass(cls);
                    setActiveClass(cls._id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedClass(cls);
                      setActiveClass(cls._id);
                    }
                  }}
                  style={{
                    minHeight: '220px',
                    width: '100%',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div className="p-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{cls.className}</h2>
                    <p className="text-gray-600">
                      <strong>Teacher:</strong> {cls.teacherName}
                    </p>
                    <p className="text-gray-600">
                      <strong>Room:</strong> {cls.roomNumber}
                    </p>
                    <p className="text-gray-600">
                      <strong>Time:</strong> {cls.time ? new Date(cls.time).toLocaleString() : 'TBA'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Activities Modal */}
            {selectedClass && !selectedActivity && (
              <div
                className="fixed inset-0 flex items-center justify-center z-50"
                onClick={() => setSelectedClass(null)}
                style={{ overflow: 'hidden', position: 'relative' }}
              >
                {/* Modal background with falling books */}
                <div aria-hidden="true" className="modal-background">
                  <FallingBooksAnimation />
                </div>

                <div
                  className="bg-gray-100 rounded-lg shadow-lg max-w-7xl w-full p-6 max-h-[85vh] overflow-auto relative z-10"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="activities-modal-title"
                >
                  <h2 id="activities-modal-title" className="text-xl font-bold mb-4 text-indigo-900">
                    Activities for {selectedClass.className}
                  </h2>

                  {activitiesLoading && <p className="text-indigo-900">Loading activities...</p>}
                  {activitiesError && <p className="text-red-600">Error: {activitiesError}</p>}
                  {!activitiesLoading && activities.length === 0 && (
                    <p className="text-indigo-900">No activities available for this class.</p>
                  )}

                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto divide-y divide-gray-200 text-sm">
                      <thead className="bg-indigo-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                            Link
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                            Attachment
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activities.map((activity) => {
                          const now = new Date();
                          const dueDate = new Date(activity.date);
                          const isSubmitted = !!activity.attachment;
                          const isLate = isSubmitted && new Date(activity.submittedAt) > dueDate;
                          const isMissing = !isSubmitted && now > dueDate;

                          let statusText = 'Pending';
                          let statusStyle = 'bg-gray-200 text-gray-700';
                          if (isSubmitted && !isLate) {
                            statusText = 'Submitted';
                            statusStyle = 'bg-green-100 text-green-800';
                          } else if (isSubmitted && isLate) {
                            statusText = 'Late';
                            statusStyle = 'bg-yellow-100 text-yellow-800';
                          } else if (isMissing) {
                            statusText = 'Missing';
                            statusStyle = 'bg-red-100 text-red-800';
                          }

                          return (
                            <tr
                              key={activity._id}
                              className="hover:bg-gray-50 focus-within:bg-gray-50 cursor-pointer"
                              onClick={() => setSelectedActivity(activity)}
                              tabIndex={0}
                              role="button"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') setSelectedActivity(activity);
                              }}
                            >
                              <td className="px-6 py-4 font-medium text-gray-900">{activity.title}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusStyle}`}>
                                  {statusText}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-700">{activity.date ? new Date(activity.date).toLocaleString() : 'N/A'}</td>
                              <td className="px-6 py-4 text-gray-700">{activity.score !== undefined ? activity.score : '-'}</td>
                              <td className="px-6 py-4 text-blue-600 underline">
                                {activity.link ? <a href={activity.link} target="_blank" rel="noreferrer">View</a> : '-'}
                              </td>
                              <td className="px-6 py-4 text-gray-700">{activity.attachment || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    onClick={() => setSelectedClass(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Submit Attachment Modal */}
            {selectedActivity && (
              <div
                className="fixed inset-0 flex items-center justify-center z-50"
                onClick={() => setSelectedActivity(null)}
                style={{ overflow: 'hidden', position: 'relative' }}
              >
                {/* Modal background with falling books */}
                <div aria-hidden="true" className="modal-background">
                  <FallingBooksAnimation />
                </div>

                <div
                  className="bg-gray-100 rounded-lg shadow-lg max-w-3xl w-full p-6 max-h-[85vh] overflow-auto relative z-10"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="activity-detail-modal-title"
                >
                  <h2 id="activity-detail-modal-title" className="text-2xl font-bold mb-4 text-indigo-900">
                    Submit Attachment for: {selectedActivity.title}
                  </h2>

                  <p className="mb-4 text-indigo-900"><strong>Description:</strong> {selectedActivity.description || 'No description'}</p>
                  <p className="mb-4 text-indigo-900"><strong>Date:</strong> {selectedActivity.date ? new Date(selectedActivity.date).toLocaleString() : 'N/A'}</p>

                  <form onSubmit={handleFileSubmit} className="flex flex-col gap-4">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="*/*"
                      className="border p-2 rounded"
                    />

                    {uploadError && <p className="text-red-600">{uploadError}</p>}
                    {uploadSuccess && <p className="text-green-600">{uploadSuccess}</p>}

                    <div className="flex justify-end gap-4">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>

                      <button
                        type="button"
                        className="bg-gray-300 py-2 px-4 rounded hover:bg-gray-400"
                        onClick={() => setSelectedActivity(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default StudentPortal;
