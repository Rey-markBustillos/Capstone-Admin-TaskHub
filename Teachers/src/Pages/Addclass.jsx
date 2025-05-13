import React, { useState } from "react";
import "../Css/Addclass.css";

const AddClass = ({ onAdd }) => {
  const [className, setClassName] = useState("");
  const [time, setTime] = useState(new Date().toISOString().slice(0, 16));
  const [roomNumber, setRoomNumber] = useState("");
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState("");
  const [message, setMessage] = useState("");

  const handleAddStudent = () => {
    if (newStudent.trim() === "") {
      setMessage("Please enter a student name.");
      return;
    }
    setStudents([...students, newStudent]);
    setNewStudent("");
    setMessage("Student added successfully!");
    setTimeout(() => setMessage(""), 2000);
  };

  const handleAddClass = () => {
    if (!className || !time || !roomNumber) {
      setMessage("Please fill in all class details.");
      return;
    }
    onAdd({ className, time, roomNumber, students });
    setClassName("");
    setTime(new Date().toISOString().slice(0, 16));
    setRoomNumber("");
    setStudents([]);
    setMessage("Class added successfully!");
    setTimeout(() => setMessage(""), 2000);
  };

  return (
    <div className="w-450 boolean h-200 grid grid-cols-1 md:grid-cols-2 bg-white">
    <div className="bg-white p-6 shadow rounded-lg w-full mb-6 ml-120">
      <h2 className="text-black font-semibold mb-2">Add Class</h2>
      <input
        type="text"
        className="border text-black p-2 w-full rounded mb-2"
        placeholder="Class Name"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
      />
      <input
        type="datetime-local"
        className="border text-black p-2 w-full rounded mb-2"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <input
        type="text"
        className="border text-black p-2 w-full rounded mb-2"
        placeholder="Room Number"
        value={roomNumber}
        onChange={(e) => setRoomNumber(e.target.value)}
      />
      <h3 className="text-md font-semibold mb-2">Add Students to Class</h3>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          className="border text-black p-2 w-full rounded"
          placeholder="Enter student name"
          value={newStudent}
          onChange={(e) => setNewStudent(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleAddStudent}
        >
          Add Student
        </button>
      </div>
      <ul className="mb-4">
        {students.map((student, index) => (
          <li key={index} className="border-b py-2">{student}</li>
        ))}
      </ul>
      <button
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
        onClick={handleAddClass}
      >
        Add Class
      </button>
      {message && <p className="mt-2 text-green-500 font-semibold">{message}</p>}
    </div>
    </div>
  );
};

export default AddClass;