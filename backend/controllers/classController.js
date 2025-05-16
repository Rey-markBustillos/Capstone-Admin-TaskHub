// controllers/classController.js
const Class = require('../models/Class'); // Import Class model
const User = require('../models/User'); // If you need User model for adding students

// Get all classes
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find(); // Find all classes in the database
    res.json(classes); // Send the classes as a response
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
    res.status(201).json(savedClass); // Send the saved class as a response
  } catch (error) {
    res.status(400).json({ message: 'Error adding class', error: error.message });
  }
};

// Delete a class by ID
const deleteClass = async (req, res) => {
  try {
    const deleted = await Class.findByIdAndDelete(req.params.id); // Delete class by ID
    if (!deleted) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting class', error: error.message });
  }
};

// Add a student to a class
const addStudentToClass = async (req, res) => {
  const { classId, studentEmail } = req.body;

  try {
    const classFound = await Class.findById(classId); // Find the class
    if (!classFound) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Find the student by email
    const student = await User.findOne({ email: studentEmail });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if the student is already added to this class
    if (classFound.students.includes(student._id)) {
      return res.status(400).json({ message: 'Student is already in the class' });
    }

    classFound.students.push(student._id); // Add student to class
    await classFound.save(); // Save the updated class

    res.status(200).json({ message: 'Student added to class successfully', class: classFound });
  } catch (error) {
    res.status(500).json({ message: 'Error adding student to class', error: error.message });
  }
};

// Get all students in a class
const getStudentsInClass = async (req, res) => {
  const { classId } = req.params;

  try {
    const classFound = await Class.findById(classId).populate('students', 'name email'); // Populate students
    if (!classFound) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.status(200).json(classFound.students); // Return students
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students in class', error: error.message });
  }
};

// Export functions to be used in the routes
module.exports = { getClasses, addClass, deleteClass, addStudentToClass, getStudentsInClass };
