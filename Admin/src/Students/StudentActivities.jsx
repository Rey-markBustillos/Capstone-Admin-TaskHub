import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { FaArrowLeft, FaPaperclip, FaStar, FaUpload, FaCalendarAlt, FaBookOpen, FaCheckCircle, FaTimesCircle, FaRedoAlt, FaHourglassHalf } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000/api';

// Use API_BASE for all API calls for consistency

const statusIcons = {
  'Graded': <FaCheckCircle className="text-blue-500 mr-1" />,
  'Graded (Late)': <FaCheckCircle className="text-blue-400 mr-1" />,
  'Late': <FaHourglassHalf className="text-orange-500 mr-1" />,
  'Submitted': <FaCheckCircle className="text-green-500 mr-1" />,
  'Missing': <FaTimesCircle className="text-red-500 mr-1" />,
  'Pending': <FaHourglassHalf className="text-yellow-500 mr-1" />,
  'Needs Resubmission': <FaRedoAlt className="text-purple-500 mr-1" />,
};

const StudentActivities = () => {
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { classId } = useParams();
  const navigate = useNavigate();

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user?._id;

  useEffect(() => {
    if (!classId || !studentId) {
      setError("Required information is missing.");
      setLoading(false);
      return;
    }

    const checkEnrollmentAndFetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/class/my-classes/${studentId}`);
        const enrolledClasses = res.data || [];
        const isEnrolled = enrolledClasses.some(cls => String(cls._id) === String(classId));

        if (!isEnrolled) {
          setError("You are not enrolled in this class.");
          setActivities([]);
          setSubmissions([]);
          setLoading(false);
          return;
        }
        const [activitiesRes, submissionsRes] = await Promise.all([
          axios.get(`${API_BASE}/activities?classId=${classId}`),
          axios.get(`${API_BASE}/activities/submissions?classId=${classId}&studentId=${studentId}`)
        ]);
        let subs = [];
        if (Array.isArray(submissionsRes.data)) {
          subs = submissionsRes.data;
        } else if (Array.isArray(submissionsRes.data.submissions)) {
          subs = submissionsRes.data.submissions;
        }
        setActivities(activitiesRes.data);
        setSubmissions(subs);
      } catch (err) {
        setError('Failed to load activities.');
        setActivities([]);
        setSubmissions([]);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkEnrollmentAndFetch();
  }, [classId, studentId]);

  // Always compare as string to avoid objectId vs string mismatch
  const getSubmissionForActivity = (activityId) => {
    return submissions.find(sub => {
      const subActId = typeof sub.activityId === 'object' && sub.activityId !== null
        ? sub.activityId._id
        : sub.activityId;
      return String(subActId) === String(activityId);
    });
  };

  // Show "Graded" if scored, "Late Graded" if late but scored, "Late" if late and not graded, "Submitted" if on time and not graded, "Missing" if overdue and no submission, "Pending" if not yet due
  const getStatus = (activity, submission) => {
    const dueDate = new Date(activity.date);
    if (submission) {
      const submissionDate = new Date(submission.submissionDate);
      if (submission.status === 'Needs Resubmission') {
        return { text: 'Needs Resubmission', style: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
      }
      if (submission.score !== null && submission.score !== undefined) {
        if (submissionDate > dueDate) {
          return { text: 'Graded (Late)', style: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
        }
        return { text: 'Graded', style: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
      }
      if (submissionDate > dueDate) {
        return { text: 'Late', style: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
      }
      return { text: 'Submitted', style: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    }
    if (new Date() > dueDate) {
      return { text: 'Missing', style: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    }
    return { text: 'Pending', style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
  };

  const handleSubmission = (activityId) => {
    navigate(`/student/class/${classId}/activity/${activityId}/submit`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FaBookOpen className="animate-bounce text-indigo-500 mb-4" size={48} />
        <div className="text-center p-10 text-lg font-semibold text-gray-600 dark:text-gray-300">Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FaTimesCircle className="text-red-500 mb-4" size={48} />
        <div className="text-center p-10 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 mt-4 ml-4">
        <NavLink
          to={`/student/class/${classId}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-700 text-white font-semibold shadow hover:bg-indigo-800 transition mb-4"
        >
          <FaArrowLeft /> Back to Class Menu
        </NavLink>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <FaBookOpen className="text-indigo-600 dark:text-indigo-400" size={32} />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Class Activities</h1>
      </div>
      <div
        className="overflow-y-auto"
        style={{ maxHeight: '70vh', minHeight: '200px' }}
      >
        {activities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => {
              const submission = getSubmissionForActivity(activity._id);
              const statusInfo = getStatus(activity, submission);

              let attachmentUrl = null;
              if (activity.attachment) {
                if (activity.attachment.startsWith('http')) {
                  attachmentUrl = activity.attachment;
                } else {
                  const filename = activity.attachment.split(/[\\/]/).pop();
                  attachmentUrl = `${API_BASE.replace('/api','')}/uploads/activities/${filename}`;
                }
              }

              return (
                <div
                  key={activity._id}
                  onClick={() => handleSubmission(activity._id)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-indigo-100 dark:border-indigo-900 relative"
                  title="Click to view/submit activity"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-2 flex items-center gap-2">
                        <FaBookOpen className="text-indigo-400" /> {activity.title}
                      </h3>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.style}`}>
                        {statusIcons[statusInfo.text] || null}
                        {statusInfo.text}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4 gap-2">
                      <FaCalendarAlt />
                      <span>Due: {new Date(activity.date).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 gap-2">
                      {submission && submission.score != null ? (
                        <div className="flex items-center">
                          <FaStar className="mr-1.5 text-yellow-500" />
                          <span className="font-semibold">{submission.score} / {activity.totalPoints || 100}</span>
                        </div>
                      ) : submission ? (
                        <div className="flex items-center text-gray-400 dark:text-gray-500">
                          <FaStar className="mr-1.5" />
                          <span>Not Graded</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-400 dark:text-gray-500">
                          <FaStar className="mr-1.5" />
                          <span>No Score</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      {attachmentUrl ? (
                        <a
                          href={attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium text-sm"
                        >
                          <FaPaperclip className="mr-1.5" /> View Attachment
                        </a>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">No Attachment</span>
                      )}

                      {((statusInfo.text !== 'Missing' && new Date() < new Date(activity.date)) || statusInfo.text === 'Needs Resubmission') ? (
                        <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          <FaUpload />
                          <span>{submission ? 'Resubmit' : 'Submit'}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                      )}
                    </div>
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                      Click to view details or submit
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <FaBookOpen className="mx-auto mb-4 text-indigo-400 dark:text-indigo-500" size={36} />
            <p className="text-gray-600 dark:text-gray-400">No activities posted for this class yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentActivities;