const Class = require('../models/Class');
const User = require('../models/User'); // User model to fetch students

// Get all classes with populated students
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('students', 'name email');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes', error: error.message });
  }
};

// Add a new class
const addClass = async (req, res) => {
  const { teacherName, className, time, roomNumber, profilePic } = req.body;
  try {
    const newClass = new Class({ teacherName, className, time, roomNumber, profilePic });
    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (error) {
    res.status(400).json({ message: 'Error adding class', error: error.message });
  }
};

// Delete a class by ID
const deleteClass = async (req, res) => {
  try {
    const deleted = await Class.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting class', error: error.message });
  }
};

// Add multiple students to a class by their IDs
const addStudentsToClass = async (req, res) => {
  const classId = req.params.id;
  const { studentIds } = req.body; // expect array of student ObjectIds

  try {
    const classFound = await Class.findById(classId);
    if (!classFound) return res.status(404).json({ message: 'Class not found' });

    // Add students if not already present
    studentIds.forEach(studentId => {
      if (!classFound.students.includes(studentId)) {
        classFound.students.push(studentId);
      }
    });

    await classFound.save();

    const populatedClass = await Class.findById(classId).populate('students', 'name email');
    res.status(200).json({ message: 'Students added to class successfully', class: populatedClass });
  } catch (error) {
    res.status(500).json({ message: 'Error adding students to class', error: error.message });
  }
};

module.exports = {
  getClasses,
  addClass,
  deleteClass,
  addStudentsToClass,
};
