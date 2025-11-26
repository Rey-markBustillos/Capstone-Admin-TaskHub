import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { FaArrowLeft, FaPaperclip, FaStar, FaUpload, FaCalendarAlt, FaBookOpen, FaCheckCircle, FaTimesCircle, FaRedoAlt, FaHourglassHalf, FaLock } from 'react-icons/fa';
import SidebarContext from '../contexts/SidebarContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const statusIcons = {
  'Graded': <FaCheckCircle className="text-blue-500 mr-1" />,
  'Graded (Late)': <FaCheckCircle className="text-blue-400 mr-1" />,
  'Late': <FaHourglassHalf className="text-orange-500 mr-1" />,
  'Submitted': <FaCheckCircle className="text-green-500 mr-1" />,
  'Missing': <FaTimesCircle className="text-red-500 mr-1" />,
  'Pending': <FaHourglassHalf className="text-yellow-500 mr-1" />,
  'Needs Resubmission': <FaRedoAlt className="text-purple-500 mr-1" />,
  'Locked': <FaLock className="text-gray-500 mr-1" />,
};

// ...existing code...
const submitActivity = async ({ activityId, studentId, content }) => {
  try {
    // normalize base URL
    const base = (API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, '');

    // resolve studentId from arg or localStorage
    let sid = studentId;
    if (!sid) {
      const stored = localStorage.getItem('user');
      if (stored) {
        try { sid = JSON.parse(stored)?._id; } catch { sid = null; }
      }
    }

    // DEBUG: log resolved values to console
    console.log('submitActivity -> resolved', { activityId, studentId: sid, content });

    if (!activityId || !sid || typeof content === 'undefined' || content === null || content === '') {
      console.error('submitActivity aborted — missing required fields', { activityId, studentId: sid, content });
      alert('Submission failed: missing activity, student, or content.');
      return;
    }

    const payload = { activityId, studentId: sid, content, submittedAt: new Date().toISOString() };

    // DEBUG: show payload that will be sent
    console.log('submitActivity -> payload', payload);

    const response = await axios.post(
      `${base}/activities/submit`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('submitActivity -> server response', response.data);
    alert(response.data.message || 'Submission successful!');
    return response.data;
  } catch (error) {
    console.error('submitActivity -> Submission Error:', error);
    if (error.response) {
      console.error('submitActivity -> server response data:', error.response.data);
      alert(error.response.data?.message || 'Submission failed!');
    } else {
      alert('Submission failed! Network error.');
    }
    throw error;
  }
};

const StudentActivities = () => {
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { classId } = useParams();
  const { isSidebarOpen } = useContext(SidebarContext);
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
        const res = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/class/my-classes/${studentId}`);
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
          axios.get(`${API_BASE_URL.replace(/\/$/, '')}/activities?classId=${classId}`),
          axios.get(`${API_BASE_URL.replace(/\/$/, '')}/activities/submissions?classId=${classId}&studentId=${studentId}`)
        ]);
        let subs = [];
        if (Array.isArray(submissionsRes.data)) {
          subs = submissionsRes.data;
        } else if (Array.isArray(submissionsRes.data.submissions)) {
          subs = submissionsRes.data.submissions;
        }
        setActivities(activitiesRes.data || []);
        setSubmissions(subs || []);
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

  const getSubmissionForActivity = (activityId) => {
    return submissions.find(sub => {
      const subActId = typeof sub.activityId === 'object' && sub.activityId !== null
        ? sub.activityId._id
        : sub.activityId;
      return String(subActId) === String(activityId);
    });
  };

  const getStatus = (activity, submission) => {
    if (activity.isLocked) {
      return { text: 'Locked', style: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' };
    }
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
    const activity = activities.find(act => act._id === activityId);
    if (activity && activity.isLocked) {
      return;
    }
    navigate(`/student/class/${classId}/activity/${activityId}/submit`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-2 sm:p-4 md:p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'ml-10 sm:ml-12 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'}`}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <FaBookOpen className="animate-bounce text-indigo-500 mb-4" size={48} />
          <div className="text-center p-10 text-lg font-semibold text-gray-100">Loading activities...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-2 sm:p-4 md:p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'ml-10 sm:ml-12 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'}`}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <FaTimesCircle className="text-red-500 mb-4" size={48} />
          <div className="text-center p-10 text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-2 sm:p-4 md:p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'ml-10 sm:ml-12 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'}`}>
      <div className="w-full max-w-none mx-auto flex flex-col justify-center items-center min-h-[80vh] px-1 sm:px-2 md:px-4 lg:px-8">
        <div className="mb-4 sm:mb-6 mt-2 sm:mt-4 ml-2 sm:ml-4 self-start">
          <NavLink
            to={`/student/class/${classId}`}
            className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base rounded-lg bg-indigo-700 text-white font-semibold shadow hover:bg-indigo-800 transition mb-2 sm:mb-4"
          >
            <FaArrowLeft className="text-xs sm:text-sm" /> <span className="hidden xs:inline sm:inline">Back to Class Menu</span><span className="xs:hidden sm:hidden">Back</span>
          </NavLink>
        </div>
        <div className="bg-white/80 dark:bg-gray-900/80 rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl p-2 sm:p-3 md:p-4 lg:p-8 xl:p-12 border-2 sm:border-4 md:border-8 border-indigo-600 dark:border-indigo-800 backdrop-blur-md w-full max-w-none overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <FaBookOpen className="text-indigo-600 dark:text-indigo-400 text-lg sm:text-2xl" />
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-indigo-700 dark:text-indigo-300">Class Activities</h1>
          </div>
          <div
            className="overflow-y-auto"
            style={{ maxHeight: '70vh', minHeight: '200px' }}
          >
            {activities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {activities.map((activity) => {
                  const submission = getSubmissionForActivity(activity._id);
                  const statusInfo = getStatus(activity, submission);

                  let attachmentUrl = null;
                  if (activity.attachment) {
                    if (activity.attachment.startsWith('http')) {
                      attachmentUrl = activity.attachment;
                    } else {
                      const filename = activity.attachment.split(/[\\/]/).pop();
                      attachmentUrl = `${API_BASE_URL.replace('/api','')}/uploads/activities/${filename}`;
                    }
                  }

                  return (
                    <div
                      key={activity._id}
                      onClick={() => handleSubmission(activity._id)}
                      className={`bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-2 sm:p-3 md:p-4 lg:p-6 flex flex-col justify-between transition-all duration-300 border border-indigo-100 dark:border-indigo-900 relative ${
                        activity.isLocked 
                          ? 'cursor-not-allowed opacity-75' 
                          : 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer'
                      }`}
                      title={activity.isLocked ? 'This activity is locked' : 'Click to view/submit activity'}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1 sm:mb-2">
                          <h3 className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white pr-2 flex items-center gap-1 sm:gap-2">
                            <FaBookOpen className="text-indigo-400 text-xs sm:text-sm" /> 
                            <span className="truncate">{activity.title}</span>
                            {activity.isLocked && (
                              <FaLock className="text-gray-500 ml-1 sm:ml-2 text-xs" title="This activity is locked" />
                            )}
                          </h3>
                          <span className={`px-1 sm:px-2 py-0.5 sm:py-1 inline-flex text-[10px] sm:text-xs leading-4 sm:leading-5 font-semibold rounded-full ${statusInfo.style}`}>
                            {statusIcons[statusInfo.text] || null}
                            {statusInfo.text}
                          </span>
                        </div>
                        <div className="flex items-center text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-4 gap-1 sm:gap-2">
                          <FaCalendarAlt className="text-[10px] sm:text-xs" />
                          <span className="truncate">Due: {new Date(activity.date).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center text-[10px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300 gap-1 sm:gap-2">
                          {submission && submission.score != null ? (
                            <div className="flex items-center">
                              <FaStar className="mr-1 sm:mr-1.5 text-yellow-500 text-[10px] sm:text-xs" />
                              <span className="font-semibold">{submission.score} / {activity.totalPoints || 100}</span>
                            </div>
                          ) : submission ? (
                            <div className="flex items-center text-gray-400 dark:text-gray-500">
                              <FaStar className="mr-1 sm:mr-1.5 text-[10px] sm:text-xs" />
                              <span>Not Graded</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400 dark:text-gray-500">
                              <FaStar className="mr-1 sm:mr-1.5 text-[10px] sm:text-xs" />
                              <span>No Score</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-4 md:mt-6 pt-2 sm:pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          {attachmentUrl ? (
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium text-[10px] sm:text-xs md:text-sm"
                            >
                              <FaPaperclip className="mr-1 sm:mr-1.5 text-[10px] sm:text-xs" /> View
                            </a>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs md:text-sm">No File</span>
                          )}

                          {activity.isLocked ? (
                            <div className="flex items-center gap-1 text-[10px] sm:text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
                              <FaLock className="text-[10px] sm:text-xs" />
                              <span>Locked</span>
                            </div>
                          ) : ((statusInfo.text !== 'Missing' && new Date() < new Date(activity.date)) || statusInfo.text === 'Needs Resubmission') ? (
                            <div className="flex items-center gap-1 text-[10px] sm:text-xs md:text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              <FaUpload className="text-[10px] sm:text-xs" />
                              <span>{submission ? 'Resubmit' : 'Submit'}</span>
                             // ...existing code...
// ...existing code...
<button
  onClick={(e) => {
    e.stopPropagation();
    const answer = window.prompt('Enter your answer (quick submit):', '');
    if (answer === null) return;

    // Ensure studentId exists before sending
    if (!studentId) {
      console.error('QuickSubmit aborted - studentId is missing. localStorage user:', localStorage.getItem('user'));
      alert('Unable to submit: student not logged in.');
      return;
    }

    // DEBUG: log values before sending
    console.log('QuickSubmit -> activityId:', activity._id, 'studentId:', studentId, 'content:', answer);

    submitActivity({
      activityId: activity._id,
      studentId,
      content: answer
    }).catch(() => {});
  }}
  className="px-2 py-1 bg-indigo-600 text-white rounded text-xs ml-2"
>
  Quick Submit
</button>
// ...existing code...
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs md:text-sm">-</span>
                          )}
                        </div>
                        <p className="text-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-3 md:mt-4">
                          {activity.isLocked ? 'Locked' : 'Click to view/submit'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-3 sm:p-6 md:p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <FaBookOpen className="mx-auto mb-4 text-indigo-400 dark:text-indigo-500" size={36} />
                <p className="text-gray-600 dark:text-gray-400">No activities posted for this class yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentActivities;
