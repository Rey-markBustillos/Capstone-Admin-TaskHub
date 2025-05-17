const User = require('../models/User');

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // exclude password
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = new User({
      name,
      email,
      password,
      role,
      active: true,
      activityLogs: ['Account created']
    });

    const savedUser = await user.save();
    const userWithoutPass = savedUser.toObject();
    delete userWithoutPass.password;
    res.status(201).json(userWithoutPass);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;

    const updatedUser = await user.save();
    const userWithoutPass = updatedUser.toObject();
    delete userWithoutPass.password;
    res.json(userWithoutPass);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Toggle active status
const toggleActiveStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.active = !user.active;
    user.activityLogs.push(user.active ? 'Account activated' : 'Account deactivated');

    const updatedUser = await user.save();
    const userWithoutPass = updatedUser.toObject();
    delete userWithoutPass.password;
    res.json(userWithoutPass);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Add a student to the user's students array
const addStudent = async (req, res) => {
  const { userId, studentName, subject, time, room } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newStudent = { name: studentName, subject, time, room };
    user.students.push(newStudent);
    await user.save();

    res.status(200).json({ message: 'Student added successfully', students: user.students });
  } catch (error) {
    res.status(500).json({ message: 'Error adding student', error: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  toggleActiveStatus,
  deleteUser,
  addStudent,
};
