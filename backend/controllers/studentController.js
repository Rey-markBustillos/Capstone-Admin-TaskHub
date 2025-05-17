const User = require("../models/User");

// Get all users with role 'student'
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password -__v");
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students", error: error.message });
  }
};

module.exports = { getStudents };
