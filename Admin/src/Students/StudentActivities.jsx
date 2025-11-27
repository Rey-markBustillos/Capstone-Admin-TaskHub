import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { FaArrowLeft, FaPaperclip, FaStar, FaUpload, FaCalendarAlt, FaBookOpen, FaCheckCircle, FaTimesCircle, FaRedoAlt, FaHourglassHalf, FaLock } from 'react-icons/fa';
import SidebarContext from '../contexts/SidebarContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

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

const submitActivity = async ({ activityId, studentId, content }) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";
    const response = await axios.post(
      `${API_BASE_URL.replace(/\/$/, '')}/activities/submit`,
      { activityId, studentId, content, submittedAt: new Date() },
      { headers: { 'Content-Type': 'application/json' } }
    );
    alert(response.data.message || 'Submission successful!');
    return response.data;
  } catch (error) {
    alert(error.response?.data?.message || 'Submission failed!');
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

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/class/my-classes/${studentId}`);
        const isEnrolled = res.data.some(cls => String(cls._id) === String(classId));
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

        const subs = Array.isArray(submissionsRes.data)
          ? submissionsRes.data
          : Array.isArray(submissionsRes.data.submissions)
            ? submissionsRes.data.submissions
            : [];

        setActivities(activitiesRes.data || []);
        setSubmissions(subs);
      } catch (err) {
        setError("Failed to load activities.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, studentId]);

  const getSubmissionForActivity = (activityId) => {
    return submissions.find(sub => {
      const subActId = sub.activityId?._id || sub.activityId;
      return String(subActId) === String(activityId);
    });
  };

  const getStatus = (activity, submission) => {
    if (activity.isLocked) return { text: 'Locked', style: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' };
    const dueDate = new Date(activity.date);
    if (submission) {
      const submissionDate = new Date(submission.submissionDate);
      if (submission.status === 'Needs Resubmission') return { text: 'Needs Resubmission', style: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
      if (submission.score != null) return { text: submissionDate > dueDate ? 'Graded (Late)' : 'Graded', style: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
      if (submissionDate > dueDate) return { text: 'Late', style: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
      return { text: 'Submitted', style: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    }
    return new Date() > dueDate ? { text: 'Missing', style: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' } : { text: 'Pending', style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
  };

  const handleSubmission = (activityId) => {
    const activity = activities.find(act => act._id === activityId);
    if (activity?.isLocked) return;
    navigate(`/student/class/${classId}/activity/${activityId}/submit`);
  };

  if (loading) return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-4 ${isSidebarOpen ? 'ml-36 w-[calc(100%-144px)]' : 'ml-10 w-[calc(100%-40px)]'}`}>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FaBookOpen className="animate-bounce text-indigo-500 mb-4" size={48} />
        <div className="text-center p-10 text-lg font-semibold text-gray-100">Loading activities...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-4 ${isSidebarOpen ? 'ml-36 w-[calc(100%-144px)]' : 'ml-10 w-[calc(100%-40px)]'}`}>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FaTimesCircle className="text-red-500 mb-4" size={48} />
        <div className="text-center p-10 text-red-400">{error}</div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-4 ${isSidebarOpen ? 'ml-36 w-[calc(100%-144px)]' : 'ml-10 w-[calc(100%-40px)]'}`}>
      <div className="max-w-none mx-auto flex flex-col justify-center items-center min-h-[80vh]">
        <div className="mb-4 ml-2 self-start">
          <NavLink to={`/student/class/${classId}`} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-700 text-white font-semibold shadow hover:bg-indigo-800">
            <FaArrowLeft /> Back
          </NavLink>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-2xl p-4 border-2 border-indigo-600 dark:border-indigo-800 w-full overflow-x-auto">
          <div className="flex items-center gap-2 mb-4">
            <FaBookOpen className="text-indigo-600 dark:text-indigo-400 text-2xl" />
            <h1 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Class Activities</h1>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '70vh', minHeight: '200px' }}>
            {activities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activities.map(activity => {
                  const submission = getSubmissionForActivity(activity._id);
                  const statusInfo = getStatus(activity, submission);
                  const attachmentUrl = activity.attachment
                    ? activity.attachment.startsWith('http') ? activity.attachment : `${API_BASE_URL.replace('/api','')}/uploads/activities/${activity.attachment.split(/[\\/]/).pop()}`
                    : null;

                  return (
                    <div key={activity._id} onClick={() => handleSubmission(activity._id)}
                      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col justify-between border border-indigo-100 dark:border-indigo-900 relative ${activity.isLocked ? 'cursor-not-allowed opacity-75' : 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer'}`}
                      title={activity.isLocked ? 'This activity is locked' : 'Click to view/submit activity'}>
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 truncate">
                            <FaBookOpen className="text-indigo-400" /> {activity.title}
                            {activity.isLocked && <FaLock className="text-gray-500" title="Locked" />}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.style}`}>
                            {statusIcons[statusInfo.text]}{statusInfo.text}
                          </span>
                        </div>

                        <div className="flex items-center text-gray-500 mb-2 gap-2 text-xs">
                          <FaCalendarAlt /> Due: {new Date(activity.date).toLocaleString()}
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          {submission?.score != null ? <span><FaStar className="text-yellow-500"/> {submission.score}/{activity.totalPoints || 100}</span> :
                           submission ? <span className="text-gray-400"><FaStar /> Not Graded</span> :
                           <span className="text-gray-400"><FaStar /> No Score</span>}
                        </div>
                      </div>

                      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between items-center">
                        {attachmentUrl ? <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center text-indigo-600 dark:text-indigo-400 text-xs"><FaPaperclip className="mr-1"/> View</a> : <span className="text-gray-400 text-xs">No File</span>}

                        {!activity.isLocked && ((statusInfo.text !== 'Missing' && new Date() < new Date(activity.date)) || statusInfo.text === 'Needs Resubmission') && (
<button
  onClick={(e) => {
    e.stopPropagation();
    const answer = window.prompt('Enter your answer (quick submit):', '');
    if (!answer || answer.trim() === '') { alert("Answer is required!"); return; }

    // ⬇️ Place the debug log here
    console.log('QuickSubmit payload:', {
      activityId: activity._id,
      studentId,
      content: answer.trim()
    });

    submitActivity({ activityId: activity._id, studentId, content: answer.trim() });
  }}
  className="px-2 py-1 bg-indigo-600 text-white rounded text-xs ml-2"
>
  Quick Submit
</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <FaBookOpen className="mx-auto mb-4 text-indigo-400 dark:text-indigo-500" size={36}/>
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
