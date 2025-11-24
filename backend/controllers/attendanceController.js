const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Class = require('../models/Class');

// POST /api/attendance/mark
exports.markAttendance = async (req, res) => {
  try {
    const { records } = req.body; // [{ studentId, status, date, classId }]
    console.log('📝 Marking attendance for', records?.length, 'students');
    console.log('📋 Records:', records);
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid records' });
    }
    
    // Save each attendance record
    const saved = await Attendance.insertMany(records);
    console.log('✅ Successfully saved', saved.length, 'attendance records');
    
    res.status(201).json({ message: 'Attendance marked', saved });
  } catch (err) {
    console.error('❌ Error marking attendance:', err);
    res.status(500).json({ message: 'Error marking attendance', error: err.message });
  }
};

// GET /api/attendance/student/:id
exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { classId } = req.query;
    const filter = { studentId };
    if (classId) filter.classId = classId;
    const records = await Attendance.find(filter).sort({ date: -1 });
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching student attendance', error: err.message });
  }
};

// GET /api/attendance/class/:id
exports.getClassAttendance = async (req, res) => {
  try {
    const classId = req.params.id;
    console.log('🎯 Fetching attendance for classId:', classId);
    
    // Group by date, then list all students and their status for that date
    const records = await Attendance.find({ classId }).populate('studentId', 'name');
    console.log('📋 Found attendance records:', records.length);
    
    // Group by date
    const grouped = {};
    records.forEach(rec => {
      const date = rec.date.toISOString().slice(0, 10);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push({ student: { _id: rec.studentId._id, name: rec.studentId.name }, status: rec.status });
    });
    
    // Convert to array format
    const history = Object.entries(grouped).map(([date, records]) => ({ date, records }));
    console.log('📊 Grouped history:', history.length, 'days');
    
    res.json({ history });
  } catch (err) {
    console.error('❌ Error fetching class attendance:', err);
    res.status(500).json({ message: 'Error fetching class attendance', error: err.message });
  }
};
