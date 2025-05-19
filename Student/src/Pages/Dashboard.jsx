import React, { useEffect, useState } from 'react';
import "../Css/Dashboard.css"; // Your custom CSS if any

const API_BASE = 'http://localhost:5000'; // Backend URL

export default function Dashboard() {
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState(null);

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/classes`);
        if (!res.ok) throw new Error('Failed to fetch classes');
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        setError(err.message || 'Error fetching classes');
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch activities for all classes whenever classes change
  useEffect(() => {
    if (!classes.length) {
      setActivities([]);
      return;
    }

    const fetchActivities = async () => {
      setLoadingActivities(true);
      setError(null);
      try {
        let allActivities = [];
        for (const cls of classes) {
          const res = await fetch(`${API_BASE}/api/activities?classId=${cls._id}`);
          if (!res.ok) throw new Error(`Failed to fetch activities for class ${cls.className}`);
          const data = await res.json();
          allActivities = allActivities.concat(data);
        }
        setActivities(allActivities);
      } catch (err) {
        setError(err.message || 'Error fetching activities');
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [classes]);

  // Filter upcoming deadlines only
  const now = new Date();
  const upcomingDeadlines = activities.filter(act => new Date(act.deadline) >= now);

  // Dummy status counts - replace with real data if available from API
  const statuses = {
    submitted: 0,
    late: 0,
    missing: 0,
  };

  if (error)
    return (
      <p className="text-red-600 p-6 text-center text-lg font-semibold">{error}</p>
    );

  if (loadingClasses || loadingActivities)
    return (
      <p className="p-6 text-center text-lg font-medium">Loading dashboard...</p>
    );

  return (
    <div className='bg-[#FFDAB9] w-450 h-330 min-h-screen'>
      <div className="p-8 w-300 ml-20 mx-auto font-sans text-gray-900">
        <h1 className="text-5xl font-extrabold mb-12 text-center tracking-tight">
          Student Dashboard
        </h1>

        {/* Enrolled Classes */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-6 border-b border-indigo-500 pb-3">
            Enrolled Classes
          </h2>
          {classes.length === 0 ? (
            <p className="text-gray-600 italic text-lg">No enrolled classes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 rounded-lg">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-indigo-700 font-semibold uppercase text-sm border-b border-indigo-200">
                      Class Name
                    </th>
                    <th className="text-left px-6 py-3 text-indigo-700 font-semibold uppercase text-sm border-b border-indigo-200">
                      Teacher
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {classes.map(cls => (
                    <tr
                      key={cls._id}
                      className="hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 border-b border-gray-200 font-semibold text-gray-900">
                        {cls.className}
                      </td>
                      <td className="px-6 py-4 border-b border-gray-200 text-gray-700">
                        {cls.teacherName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Upcoming Deadlines */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-6 border-b border-indigo-500 pb-3">
            Upcoming Deadlines
          </h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-gray-600 italic text-lg">No upcoming deadlines.</p>
          ) : (
            <ul className="list-disc list-inside space-y-3 text-lg text-gray-800">
              {upcomingDeadlines
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                .map(act => (
                  <li
                    key={act._id}
                    className="hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <strong className="font-semibold">{act.title}</strong> for{' '}
                    <em className="italic">{act.className}</em> — Due:{' '}
                    {new Date(act.deadline).toLocaleDateString()}
                  </li>
                ))}
            </ul>
          )}
        </section>

        {/* Quick Stats */}
        <section className="mb-20">
          <h2 className="text-3xl font-semibold mb-8 border-b border-indigo-500 pb-3">
            Quick Stats
          </h2>
          <div className="grid grid-cols-4 gap-8 max-w-md mx-auto">
            <div className="bg-indigo-50 p-8 rounded-xl shadow-md text-center">
              <p className="text-4xl font-extrabold text-indigo-700">{upcomingDeadlines.length}</p>
              <p className="mt-2 text-indigo-900 font-semibold tracking-wide">Assignments Due</p>
            </div>
            <div className="bg-green-50 p-8 rounded-xl shadow-md text-center">
              <p className="text-4xl font-extrabold text-green-700">{statuses.submitted}</p>
              <p className="mt-2 text-green-900 font-semibold tracking-wide">Submitted</p>
            </div>
            <div className="bg-yellow-50 p-8 rounded-xl shadow-md text-center">
              <p className="text-4xl font-extrabold text-yellow-700">{statuses.late}</p>
              <p className="mt-2 text-yellow-900 font-semibold tracking-wide">Late</p>
            </div>
            <div className="bg-red-50 p-8 rounded-xl shadow-md text-center">
              <p className="text-4xl font-extrabold text-red-700">{statuses.missing}</p>
              <p className="mt-2 text-red-900 font-semibold tracking-wide">Missing</p>
            </div>
          </div>
        </section>

        {/* Recent Announcements */}
        <section className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6 border-b border-indigo-500 pb-3">
            Recent Announcements
          </h2>
          <p className="italic text-gray-500 text-lg">No announcements yet.</p>
        </section>
      </div>
    </div>
  );
}
