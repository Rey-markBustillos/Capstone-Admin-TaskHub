import React from "react";
import { useNavigate } from "react-router-dom";

const SubjectList = () => {
  const navigate = useNavigate();
  
  const subjects = [
    { id: 1, name: "Mathematics", section: "A", time: "9:00 AM - 10:30 AM", room: "101" },
    { id: 2, name: "Science", section: "B", time: "10:45 AM - 12:15 PM", room: "102" },
    { id: 3, name: "English", section: "A", time: "1:00 PM - 2:30 PM", room: "103" },
    { id: 4, name: "History", section: "C", time: "2:45 PM - 4:15 PM", room: "104" },
  ];

  return (
    <div className="bg-white h-195 w-430">
    <div className="w-250 ml-100 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">📚 Subject List</h2>
      <ul className="space-y-4">
        {subjects.map((subject) => (
          <li key={subject.id} className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-semibold text-gray-800">{subject.name}</span>
                <p className="text-sm text-gray-600">Section: {subject.section}</p>
                <p className="text-sm text-gray-600">Time: {subject.time}</p>
                <p className="text-sm text-gray-600">Room: {subject.room}</p>
              </div>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                onClick={() => navigate(`/classfeed/${subject.id}`)}
              >
                Enter
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
};

export default SubjectList;
