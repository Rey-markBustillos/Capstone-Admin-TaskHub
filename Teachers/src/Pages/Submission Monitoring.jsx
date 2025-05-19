import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000'; // Your backend URL

export default function ClassMonitoring() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState(null);

  // Fetch classes
  useEffect(() => {
    setLoadingClasses(true);
    fetch(`${API_BASE}/api/classes`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch classes');
        return res.json();
      })
      .then(data => {
        setClasses(data);
        setLoadingClasses(false);
      })
      .catch(err => {
        setError(err.message);
        setLoadingClasses(false);
      });
  }, []);

  // Fetch activities for selected class
  useEffect(() => {
    if (!selectedClass) {
      setActivities([]);
      return;
    }

    setLoadingActivities(true);
    fetch(`${API_BASE}/api/activities?classId=${selectedClass._id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch activities');
        return res.json();
      })
      .then(data => {
        setActivities(data);
        setLoadingActivities(false);
      })
      .catch(err => {
        setError(err.message);
        setLoadingActivities(false);
      });
  }, [selectedClass]);

  if (error) return <p className="text-red-600">{error}</p>;

  if (!selectedClass) {
    return (
      <div className="min-h-screen w-430 bg-orange-100 flex justify-center items-start p-6">
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl text-gray-900 font-semibold mb-6">Class Monitoring</h2>
          {loadingClasses ? (
            <p>Loading classes...</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Class Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Students
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.map(cls => (
                  <tr key={cls._id} className="hover:bg-gray-100 cursor-pointer">
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{cls.className}</td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                      {cls.students ? cls.students.length : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedClass(cls)}
                        className="bg-green-500 px-3 py-1 rounded text-white font-semibold hover:bg-green-600"
                      >
                        View Activities
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // Show activities for selected class
  return (
    <div className="min-h-screen w-430 bg-orange-100 flex justify-center items-start p-6">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-md p-6">
        <button
          onClick={() => setSelectedClass(null)}
          className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Back to Classes
        </button>

        <h2 className="text-2xl text-gray-900 font-semibold mb-6">
          Activities for <span className="text-indigo-600">{selectedClass.className}</span>
        </h2>

        {loadingActivities ? (
          <p>Loading activities...</p>
        ) : activities.length === 0 ? (
          <p className="text-gray-500 italic">No activities found for this class.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Points
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Attachment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map(act => (
                <tr key={act._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{act.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {new Date(act.deadline).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                    {act.points} pts
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {act.attachedFile ? (
                      <a
                        href={`${API_BASE}/uploads/${act.attachedFile.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        {act.attachedFile.originalName}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">No attachment</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
