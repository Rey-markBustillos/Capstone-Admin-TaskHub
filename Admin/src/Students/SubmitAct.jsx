import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ViewTask() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activities, setActivities] = useState([]);
  const studentId = localStorage.getItem('studentId'); // kunin studentId from localStorage or auth context

  // Fetch classes where student is added
  useEffect(() => {
    if (!studentId) return;
    axios.get(`/api/classes?studentId=${studentId}`)
      .then(res => {
        setClasses(res.data);
        setSelectedClass(null);
        setActivities([]);
      })
      .catch(err => console.error('Error fetching classes:', err));
  }, [studentId]);

  // When selectedClass changes, fetch activities for that class for the student
  useEffect(() => {
    if (!selectedClass) {
      setActivities([]);
      return;
    }
    axios.get(`/api/activities?classId=${selectedClass._id}&studentId=${studentId}`)
      .then(res => setActivities(res.data))
      .catch(err => console.error('Error fetching activities:', err));
  }, [selectedClass, studentId]);

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto' }}>
      <h2>Your Classes</h2>
      {classes.length === 0 && <p>You are not enrolled in any classes yet.</p>}
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {classes.map(cls => (
          <li
            key={cls._id}
            onClick={() => setSelectedClass(cls)}
            style={{
              cursor: 'pointer',
              padding: '10px',
              margin: '5px 0',
              backgroundColor: selectedClass?._id === cls._id ? '#cce5ff' : '#f8f9fa',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          >
            {cls.className} <br />
            <small>Teacher: {cls.teacherName}</small>
          </li>
        ))}
      </ul>

      {selectedClass && (
        <>
          <h3>Activities for {selectedClass.className}</h3>
          {activities.length === 0 && <p>No activities found for this class.</p>}
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {activities.map(activity => (
              <li
                key={activity._id}
                style={{
                  padding: '10px',
                  margin: '5px 0',
                  backgroundColor: '#e2e3e5',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                }}
              >
                <strong>{activity.title}</strong> <br />
                Deadline: {new Date(activity.deadline).toLocaleDateString()} <br />
                Points: {activity.points || 0}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
