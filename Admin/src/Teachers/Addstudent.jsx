import React, { useState } from "react";

const AddStudent = ({ onAdd }) => {
  const [newStudent, setNewStudent] = useState("");
  const [message, setMessage] = useState("");
  const [classList] = useState([
    { subject: "Mathematics", time: "8:00 AM - 9:00 AM", room: "101" },
    { subject: "Science", time: "9:00 AM - 10:00 AM", room: "102" },
    { subject: "History", time: "10:00 AM - 11:00 AM", room: "103" },
    { subject: "English", time: "11:00 AM - 12:00 PM", room: "104" }
  ]);

  const handleAddStudent = () => {
    if (newStudent.trim() === "") {
      setMessage("Please enter a student name.");
      return;
    }
    
    onAdd(newStudent);
    setNewStudent("");
    setMessage("Student added successfully!");

    // Clear message after 2 seconds
    setTimeout(() => setMessage(""), 2000);
  };

  return (
    <div className="w-450 boolean h-200 grid grid-cols-1 md:grid-cols-2 bg-white ">
    <div className="bg-white p-6 shadow rounded-lg w-full mb-6 ml-100">
      <h2 className="text-black font-semibold mb-2">Add Student</h2>
      <div className="flex gap-2">
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
      {message && <p className="mt-2 text-green-500 font-semibold">{message}</p>}
      
      {/* Class List Table */}
      <div className="mt-6">
        <h2 className="text-black font-semibold mb-2">Class List</h2>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black text-black p-2">Subject</th>
              <th className="border border-black text-black p-2">Time</th>
              <th className="border border-black text-black p-2">Room Number</th>
            </tr>
          </thead>
          <tbody>
            {classList.map((classItem, index) => (
              <tr key={index} className="text-center">
                <td className="border border-black p-2">{classItem.subject}</td>
                <td className="border border-black p-2">{classItem.time}</td>
                <td className="border border-black p-2">{classItem.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;