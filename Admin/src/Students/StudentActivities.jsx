import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPaperclip, FaStar, FaUpload, FaCalendarAlt } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';

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

    const fetchActivitiesAndSubmissions = async () => {
      setLoading(true);
      try {
        const [activitiesRes, submissionsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/activities?classId=${classId}`),
          axios.get(`${API_BASE_URL}/activities/submissions?classId=${classId}&studentId=${studentId}`)
        ]);
        setActivities(activitiesRes.data);
        setSubmissions(submissionsRes.data);
      } catch (err) {
        setError('Failed to load activities.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivitiesAndSubmissions();
  }, [classId, studentId]);

  const getSubmissionForActivity = (activityId) => {
    return submissions.find(sub => sub.activityId?._id === activityId);
  };

  const getStatus = (activity, submission) => {
    const dueDate = new Date(activity.date);
    const now = new Date();

    if (submission) {
      if (submission.status === 'Needs Resubmission') {
        return { text: 'Needs Resubmission', style: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
      }
      const submissionDate = new Date(submission.submissionDate);
      if (submissionDate > dueDate) {
        return { text: 'Late', style: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
      }
      return { text: 'Submitted', style: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    }

    if (now > dueDate) {
      return { text: 'Missing', style: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    }

    return { text: 'Pending', style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
  };

  const handleSubmission = (activityId) => {
    navigate(`/student/class/${classId}/activity/${activityId}/submit`);
  };

  if (loading) {
    return <div className="text-center p-10">Loading activities...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Class Activities</h1>
      {activities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => {
            const submission = getSubmissionForActivity(activity._id);
            const statusInfo = getStatus(activity, submission);
            
            let attachmentUrl = null;
            if (activity.attachment) {
              const filename = activity.attachment.split(/[\\/]/).pop();
              attachmentUrl = `${SERVER_URL}/uploads/activities/${filename}`;
            }

            return (
              <div 
                key={activity._id}
                onClick={() => handleSubmission(activity._id)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                title="Click to view/submit activity"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-2">{activity.title}</h3>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.style}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <FaCalendarAlt className="mr-2"/>
                    <span>Due: {new Date(activity.date).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    {submission && submission.score != null ? (
                      <div className="flex items-center">
                         <FaStar className="mr-1.5 text-yellow-500" /> 
                         <span className="font-semibold">{submission.score} / {activity.totalPoints || 100}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400 dark:text-gray-500">
                        <FaStar className="mr-1.5" />
                        <span>{submission ? 'Not Graded' : 'No Score'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  {attachmentUrl ? (
                    <a 
                      href={attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={(e) => e.stopPropagation()} // Prevent card click from firing
                      className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium text-sm"
                    >
                      <FaPaperclip className="mr-1.5" /> View Attachment
                    </a>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No Attachment</span>
                  )}
                  
                  {statusInfo.text !== 'Missing' && new Date() < new Date(activity.date) || statusInfo.text === 'Needs Resubmission' ? (
                    <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      <FaUpload />
                      <span>{submission ? 'Resubmit' : 'Submit'}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-gray-600 dark:text-gray-400">No activities posted for this class yet.</p>
        </div>
      )}
    </div>
  );
};

export default StudentActivities;