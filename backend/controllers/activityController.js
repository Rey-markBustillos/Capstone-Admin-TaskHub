const Activity = require('../models/Activity');
const Class = require('../models/Class');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create activity
const createActivity = async (req, res) => {
  try {
    const { title, instructions, deadline, classId, className, points } = req.body;

    if (!title || !deadline || !classId || !className) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const activityData = {
      title,
      instructions,
      deadline,
      classId,
      className,
      points: points ? Number(points) : 0,
    };

    if (req.file) {
      activityData.attachedFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
    }

    const newActivity = new Activity(activityData);
    const savedActivity = await newActivity.save();

    return res.status(201).json(savedActivity);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating activity', error: error.message });
  }
};

// Get activities by classId, ensuring the student is enrolled in the class
const getActivitiesByClass = async (req, res) => {
  try {
    const { studentId, classId } = req.query;

    if (!classId || !studentId) return res.status(400).json({ message: 'classId and studentId query parameters required' });

    // Fetch the class document by classId
    const classDoc = await Class.findById(classId).lean();
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    // Check if the student is enrolled in the class by comparing studentId with class.students
    const isStudentInClass = classDoc.students.some(
      (student) => student.toString() === studentId.toString()
    );

    if (!isStudentInClass) {
      return res.status(403).json({ message: 'Access denied. Student is not enrolled in this class.' });
    }

    // If student is enrolled, fetch the activities associated with the classId
    const activities = await Activity.find({ classId }).lean();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};

// Get all classes, optionally filtered by studentId query param
const getClasses = async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid or missing studentId' });
    }

    const classes = await Class.find({ students: studentId })
      .populate('students', 'name email');
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

// Add students to class
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
  createActivity,
  getActivitiesByClass,
  getClasses,
  addClass,
  deleteClass,
  addStudentsToClass,
};
