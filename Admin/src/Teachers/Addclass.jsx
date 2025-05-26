import React, { useState } from "react";

const AddClass = ({ onAdd }) => {
  const [formData, setFormData] = useState({
    teacherName: "",
    className: "",
    time: "",
    roomNumber: "",
    profilePic: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, profilePic: reader.result }));
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to add class");
      }

      const newClass = await response.json();
      if (onAdd) onAdd(newClass);  // <-- only call if onAdd exists
      setFormData({
        teacherName: "",
        className: "",
        time: "",
        roomNumber: "",
        profilePic: "",
      });
    } catch (error) {
      console.error("Error:", error.message);
      alert("Failed to add class. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap gap-4 items-center mb-6 bg-gray-700 p-4 rounded-xl"
    >
      <input
        type="text"
        name="teacherName"
        placeholder="Teacher Name"
        value={formData.teacherName}
        onChange={handleChange}
        required
        className="bg-gray-100 text-black border border-gray-400 rounded-lg px-3 py-2 w-44"
      />
      <input
        type="text"
        name="className"
        placeholder="Class Name"
        value={formData.className}
        onChange={handleChange}
        required
        className="bg-gray-100 text-black border border-gray-400 rounded-lg px-3 py-2 w-44"
      />
      <input
        type="datetime-local"
        name="time"
        value={formData.time}
        onChange={handleChange}
        required
        className="bg-gray-100 text-black border border-gray-400 rounded-lg px-3 py-2 w-52"
      />
      <input
        type="text"
        name="roomNumber"
        placeholder="Room"
        value={formData.roomNumber}
        onChange={handleChange}
        required
        className="bg-gray-100 text-black border border-gray-400 rounded-lg px-3 py-2 w-28"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload(e.target.files[0])}
        className="bg-gray-100 text-black border border-gray-400 rounded-lg px-3 py-2"
      />
      <button
        type="submit"
        className="bg-yellow-400 text-white font-bold px-4 py-2 rounded-lg hover:bg-yellow-500"
      >
        Add Class
      </button>
    </form>
  );
};

export default AddClass;
