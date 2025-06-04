import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFile, FaFilePdf, FaFileImage, FaFileWord, FaFileArchive, FaDownload } from 'react-icons/fa'; // Import icons

const ActivityMonitoring = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Kunin teacherId mula sa localStorage user object
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user && user.role === 'teacher' ? user._id : null;

  // Fetch classes ng teacher
  useEffect(() => {
    if (!teacherId) {
      setError('Teacher not logged in');
      return;
    }

    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/classes?teacherId=${teacherId}`);
        setClasses(res.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [teacherId]);

  // Fetch submissions kapag may selected class
  useEffect(() => {
    if (!selectedClass) return;

    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        // Gamitin ang existing route na may teacherId at optional classId query
        const res = await axios.get(
          `http://localhost:5000/api/activities/submissions/${teacherId}?classId=${selectedClass._id}`
        );
        setSubmissions(res.data.submissions || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [selectedClass, teacherId]);

  if (loading) return <p className="text-center mt-6">Loading...</p>;
  if (error) return <p className="text-center mt-6 text-red-600">Error: {error}</p>;

  // Ipakita ang list ng classes kapag walang napiling class
  if (!selectedClass) {
    if (classes.length === 0) return <p className="text-center mt-6">No classes found.</p>;

    const filteredClasses = classes.filter((cls) =>
      cls.className.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Select a Class</h1>

        <input
          type="text"
          placeholder="Search class..."
          className="w-full p-3 border border-gray-300 rounded mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <ul className="space-y-3">
          {filteredClasses.map((cls) => (
            <li
              key={cls._id}
              className="cursor-pointer p-4 border border-gray-300 rounded hover:bg-blue-50 transition"
              onClick={() => setSelectedClass(cls)}
            >
              <p className="text-xl font-semibold">{cls.className}</p>
              {cls.section && <p className="text-gray-600">Section: {cls.section}</p>}
              {cls.roomNumber && <p className="text-gray-600">Room: {cls.roomNumber}</p>}
              {cls.time && (
                <p className="text-gray-600">
                  Time: {new Date(cls.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Ipakita ang activity submissions ng napiling class
  return (
    <div className="max-w-6xl mx-auto p-6">
      <button
        className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
        onClick={() => {
          setSelectedClass(null);
          setSubmissions([]);
          setError(null);
        }}
      >
        &larr; Back to Classes
      </button>

      <h1 className="text-3xl font-bold mb-6">
        Activity Submissions for <span className="text-blue-600">{selectedClass.className}</span>
      </h1>

      {submissions.length === 0 ? (
        <p>No activity submissions found for this class.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-left">
            <thead>
              <tr>
                <th className="border border-gray-300 px-3 py-2">Activity Title</th>
                <th className="border border-gray-300 px-3 py-2">Submitted By</th>
                <th className="border border-gray-300 px-3 py-2">Email</th>
                <th className="border border-gray-300 px-3 py-2">Date</th>
                <th className="border border-gray-300 px-3 py-2">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                let fileTypeIcon = <FaFile />;
                let action = 'View'; // Default action

                // Log the attachment URL for debugging
                console.log('Attachment URL:', sub.attachment);

                if (sub.attachment) {
                  if (sub.attachment.toLowerCase().endsWith('.pdf')) {
                    fileTypeIcon = <FaFilePdf />;
                  } else if (
                    sub.attachment.toLowerCase().endsWith('.jpg') ||
                    sub.attachment.toLowerCase().endsWith('.jpeg') ||
                    sub.attachment.toLowerCase().endsWith('.png')
                  ) {
                    fileTypeIcon = <FaFileImage />;
                  } else if (sub.attachment.toLowerCase().endsWith('.docx')) {
                    fileTypeIcon = <FaFileWord />;
                    action = 'Download'; // Change action to Download
                  } else if (sub.attachment.toLowerCase().endsWith('.zip')) {
                    fileTypeIcon = <FaFileArchive />;
                    action = 'Download'; // Change action to Download
                  }
                }

                // Construct the absolute URL
                const baseUrl = 'http://localhost:5000'; // Replace with your backend URL
                const absoluteUrl = sub.attachment ? `${baseUrl}${sub.attachment}` : '';

                return (
                  <tr key={sub._id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-3 py-2 font-semibold">{sub.title}</td>
                    <td className="border border-gray-300 px-3 py-2">{sub.createdBy?.name || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2">{sub.createdBy?.email || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {sub.date ? new Date(sub.date).toLocaleString() : '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {sub.attachment ? (
                        <>
                          <a
                            href={absoluteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                            }}
                          >
                            {fileTypeIcon}
                            <span className="ml-1">{action}</span>
                            {action === 'Download' && <FaDownload className="ml-1" />}
                          </a>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivityMonitoring;