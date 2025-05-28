const Class = require('../models/Class');
const User = require('../models/User');
const mongoose = require('mongoose');

// GET /api/classes?teacherId=...&studentId=...
exports.getClasses = async (req, res) => {
  try {
    const { teacherId, studentId } = req.query;
    let query = {};

    if (teacherId) {
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res.status(400).json({ message: 'Invalid teacherId' });
      }
      query.teacherId = teacherId;
    }

    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: 'Invalid studentId' });
      }
      query.students = studentId;
    }

    const classes = await Class.find(query).populate('students', 'name email');
    return res.json(classes);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching classes', error: error.message });
  }
};

// POST /api/classes
exports.addClass = async (req, res) => {
  try {
    const { teacherName, teacherId, className, time, roomNumber, profilePic } = req.body;

    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: 'Valid teacherId is required' });
    }

    const newClass = new Class({
      teacherName,
      teacherId,
      className,
      time,
      roomNumber,
      profilePic,
      students: [],
    });

    const savedClass = await newClass.save();
    const populatedClass = await savedClass.populate('students', 'name email').execPopulate();

    return res.status(201).json(populatedClass);
  } catch (error) {
    return res.status(400).json({ message: 'Error adding class', error: error.message });
  }
};

// DELETE /api/classes/:id
exports.deleteClass = async (req, res) => {
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

// PUT /api/classes/:id/add-students
exports.addStudentsToClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'studentIds must be a non-empty array' });
    }

    const classFound = await Class.findById(classId);
    if (!classFound) {
      return res.status(404).json({ message: 'Class not found' });
    }

    studentIds.forEach((studentId) => {
      if (
        mongoose.Types.ObjectId.isValid(studentId) &&
        !classFound.students.some((s) => s.toString() === studentId)
      ) {
        classFound.students.push(studentId);
      }
    });

    await classFound.save();

    // Update enrolledClasses for each student
    for (const studentId of studentIds) {
      const student = await User.findById(studentId);
      if (student) {
        if (!student.enrolledClasses) student.enrolledClasses = [];
        if (!student.enrolledClasses.includes(classId)) {
          student.enrolledClasses.push(classId);
          await student.save();
        }
      }
    }

    const populatedClass = await Class.findById(classId).populate('students', 'name email');
    return res.json({ message: 'Students added successfully', class: populatedClass });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding students to class', error: error.message });
  }
};
