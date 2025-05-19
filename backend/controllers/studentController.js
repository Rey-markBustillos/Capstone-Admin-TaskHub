const User = require('../models/User');

const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }, 'name email');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

module.exports = { getStudents };
