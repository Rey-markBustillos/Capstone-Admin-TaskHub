// controllers/userController.js
const User = require('../models/User');

// Add a student to the user's list
const addStudent = async (req, res) => {
  const { userId, studentName, subject, time, room } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add the new student to the students array
    const newStudent = { name: studentName, subject, time, room };
    user.students.push(newStudent);

    // Save the user with the updated students list
    await user.save();
    res.status(200).json({ message: 'Student added successfully', students: user.students });
  } catch (error) {
    res.status(500).json({ message: 'Error adding student', error: error.message });
  }
};

module.exports = { addStudent };
