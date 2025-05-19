const Class = require('../models/Class');

// Get all classes with students populated (name, email)
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

// Add students to a class
const addStudentsToClass = async (req, res) => {
  const classId = req.params.id;
  const { studentIds } = req.body;

  try {
    const classFound = await Class.findById(classId);
    if (!classFound) return res.status(404).json({ message: 'Class not found' });

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
