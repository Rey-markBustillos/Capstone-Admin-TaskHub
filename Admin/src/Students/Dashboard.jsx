import React, { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

const API_BASE = "http://localhost:5000";

export default function StudentDashboard() {
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/classes`);
        if (!res.ok) throw new Error("Failed to fetch classes");
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        setError(err.message || "Error fetching classes");
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

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
        setError(err.message || "Error fetching activities");
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [classes]);

  const now = new Date();
  const upcomingDeadlines = activities.filter((act) => new Date(act.deadline) >= now);

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
      <div className="flex justify-center items-center h-screen">
        <ClipLoader size={70} color={"#4F46E5"} loading={true} />
      </div>
    );

  return (
    <div className="bg-[#FFDAB9] min-h-screen p-8 font-sans text-gray-900">
      <h1 className="text-5xl font-extrabold mb-12 text-center tracking-tight">
        Student Dashboard
      </h1>

      {/* Quick Stats */}
      <section className="mb-20 max-w-5xl mx-auto">
        <h2 className="text-3xl font-semibold mb-8 border-b border-indigo-500 pb-3">
          Quick Stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-indigo-50 p-8 rounded-xl shadow-md text-center flex flex-col justify-center items-center">
            <p className="text-4xl font-extrabold text-indigo-700">{upcomingDeadlines.length}</p>
            <p className="mt-2 text-indigo-900 font-semibold tracking-wide">Assignments Due</p>
          </div>
          <div className="bg-green-50 p-8 rounded-xl shadow-md text-center flex flex-col justify-center items-center">
            <p className="text-4xl font-extrabold text-green-700">{statuses.submitted}</p>
            <p className="mt-2 text-green-900 font-semibold tracking-wide">Submitted</p>
          </div>
          <div className="bg-yellow-50 p-8 rounded-xl shadow-md text-center flex flex-col justify-center items-center">
            <p className="text-4xl font-extrabold text-yellow-700">{statuses.late}</p>
            <p className="mt-2 text-yellow-900 font-semibold tracking-wide">Late</p>
          </div>
          <div className="bg-red-50 p-8 rounded-xl shadow-md text-center flex flex-col justify-center items-center">
            <p className="text-4xl font-extrabold text-red-700">{statuses.missing}</p>
            <p className="mt-2 text-red-900 font-semibold tracking-wide">Missing</p>
          </div>
        </div>
      </section>

      {/* Enrolled Classes */}
      <section className="mb-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-semibold mb-6 border-b border-indigo-500 pb-3">
          Enrolled Classes
        </h2>
        {classes.length === 0 ? (
          <p className="text-gray-600 italic text-lg text-center">No enrolled classes.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls._id}
                className="bg-indigo-50 border border-indigo-200 rounded-xl shadow p-6 flex flex-col justify-between hover:shadow-lg transition cursor-pointer"
              >
                <div>
                  <p className="text-xl font-bold text-indigo-700 mb-2">{cls.className}</p>
                  <p className="text-gray-700 mb-1">
                    <span className="font-semibold">Teacher:</span>{" "}
                    <span className="italic">{cls.teacherName}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Deadlines */}
      <section className="mb-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-semibold mb-6 border-b border-indigo-500 pb-3">
          Upcoming Deadlines
        </h2>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-gray-600 italic text-lg text-center">No upcoming deadlines.</p>
        ) : (
          <ul className="divide-y divide-indigo-200">
            {upcomingDeadlines
              .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
              .map((act) => (
                <li
                  key={act._id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 py-4 px-2"
                >
                  <span className="font-semibold text-indigo-700 text-lg">{act.title}</span>
                  <span className="text-gray-500 text-base">for</span>
                  <span className="italic text-indigo-900 text-base">{act.className}</span>
                  <span className="text-gray-500 text-base">— Due:</span>
                  <span className="font-medium text-red-600 text-base">
                    {new Date(act.deadline).toLocaleDateString()}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* Recent Announcements */}
      <section className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-semibold mb-6 border-b border-indigo-500 pb-3">
          Recent Announcements
        </h2>
        <p className="italic text-gray-500 text-lg">No announcements yet.</p>
      </section>
    </div>
  );
}
