const User = require('../models/User');

const getStudents = async (req, res) => {
  try {
    // Optionally accept role query parameter
    const role = req.query.role || 'student';

    if (role !== 'student') {
      return res.status(400).json({ message: 'Only role=student is supported' });
    }

    const students = await User.find({ role: 'student' }, 'name email');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

module.exports = { getStudents };
