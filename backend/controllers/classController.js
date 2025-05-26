const Class = require('../models/Class');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all classes, optionally filtered by studentId query param
const getClasses = async (req, res) => {
  try {
    const { studentId } = req.query;

    // Validate if studentId exists and is a valid ObjectId
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid or missing studentId' });
    }

    const classes = await Class.find({ students: studentId })
      .populate('students', 'name email'); // Populate the students' name and email fields
    return res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({ message: 'Error fetching classes', error: error.message });
  }
};

// Add new class, optionally with initial students
const addClass = async (req, res) => {
  const { teacherName, className, time, roomNumber, profilePic, studentIds } = req.body;

  try {
    let validStudentIds = [];
    if (studentIds) {
      if (!Array.isArray(studentIds)) {
        return res.status(400).json({ message: 'studentIds must be an array' });
      }
      validStudentIds = studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    }

    const newClass = new Class({
      teacherName,
      className,
      time,
      roomNumber,
      profilePic,
      students: validStudentIds,
    });

    const savedClass = await newClass.save();
    const populatedClass = await Class.findById(savedClass._id).populate('students', 'name email');

    return res.status(201).json(populatedClass);
  } catch (error) {
    return res.status(400).json({ message: 'Error adding class', error: error.message });
  }
};

// Delete class by ID
const deleteClass = async (req, res) => {
  try {
    const deleted = await Class.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Class not found' });
    }
    return res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting class', error: error.message });
  }
};

// Add students to class by pushing studentIds to students array (avoid duplicates)
const addStudentsToClass = async (req, res) => {
  const classId = req.params.id;
  const { studentIds } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ message: 'studentIds must be a non-empty array' });
  }

  try {
    const classFound = await Class.findById(classId);
    if (!classFound) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Add students to the class
    studentIds.forEach((studentId) => {
      if (
        mongoose.Types.ObjectId.isValid(studentId) &&
        !classFound.students.some((s) => s.toString() === studentId)
      ) {
        classFound.students.push(studentId);
      }
    });

    // Save class with new students
    await classFound.save();

    // Also update the student’s enrolledClasses list in the User model
    for (const studentId of studentIds) {
      const student = await User.findById(studentId);
      if (student) {
        // Make sure the student’s `enrolledClasses` is updated
        if (!student.enrolledClasses) student.enrolledClasses = [];
        if (!student.enrolledClasses.includes(classId)) {
          student.enrolledClasses.push(classId);
          await student.save();
        }
      }
    }

    const populatedClass = await Class.findById(classId).populate('students', 'name email');
    return res.status(200).json({ message: 'Students added to class successfully', class: populatedClass });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding students to class', error: error.message });
  }
};

module.exports = {
  getClasses,
  addClass,
  deleteClass,
  addStudentsToClass,
};
