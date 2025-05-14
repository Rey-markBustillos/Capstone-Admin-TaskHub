import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AddClass from "./Addclass";

const ClassManager = () => {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/classes");
        if (!response.ok) throw new Error("Failed to fetch classes");
        const data = await response.json();
        setClasses(data);
      } catch (error) {
        console.error("Error fetching classes:", error.message);
      }
    };

    fetchClasses();
  }, []);

  const handleAddClass = (newClass) => {
    setClasses((prev) => [...prev, newClass]);
  };

  return (
    <div className="p-6 mx-auto w-420 ml-10 bg-gray-100 min-h-screen">
      {/* White panel container */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <AddClass onAdd={handleAddClass} />
        <div className="grid grid-cols-5 font-bold bg-yellow-400 text-white px-4 py-2 rounded-lg mb-4">
          <span>Start Date</span>
          <span>Subject</span>
          <span>Room</span>
          <span>Teacher</span>
          <span>Action</span>
        </div>

        {/* Class list */}
        {classes.length === 0 ? (
          <p className="text-gray-600 text-center mt-10">No classes added yet.</p>
        ) : (
          <div className="space-y-4">
            {classes.map((cls, index) => (
              <div
                key={cls._id || index}
                className="grid grid-cols-5 items-center bg-gray-50 rounded-lg shadow-sm px-4 py-3"
              >
                {/* Start Date */}
                <div className="text-black">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">📅</span>
                    <span>{new Date(cls.time).toLocaleString()}</span>
                  </div>
                </div>

                {/* Class Name */}
                <div className="text-black font-semibold">{cls.className}</div>

                {/* Room Number */}
                <div className="text-black">{cls.roomNumber}</div>

                {/* Teacher */}
                <div className="flex items-center space-x-2">
                  <img
                    src={cls.profilePic || "/default-avatar.png"}
                    alt="teacher"
                    className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400"
                  />
                  <span className="text-black">{cls.teacherName}</span>
                </div>

                {/* Enter button */}
                <div>
                  <Link to={`/class/${cls._id || index}`}>
                    <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-4 py-2 rounded-md">
                      Enter
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassManager;
