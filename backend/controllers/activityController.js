const Activity = require('../models/Activity');
const Class = require('../models/Class');
const Submission = require('../models/Submission');
const mongoose = require('mongoose');

// Create activity
exports.createActivity = async (req, res) => {
  try {
    const { title, description, date, score, link, createdBy, classId } = req.body;
    let attachmentPath = null;

    if (req.file) {
      attachmentPath = `/uploads/activities/${req.file.filename}`;
    } else if (req.body.attachment) {
      attachmentPath = req.body.attachment;
    }

    if (!title || !date || !classId) {
      return res.status(400).json({ message: 'Title, date, and classId are required.' });
    }

    const activity = new Activity({
      title,
      description,
      date,
      score,
      link,
      attachment: attachmentPath,
      createdBy,
      classId,
    });

    const savedActivity = await activity.save();
    res.status(201).json(savedActivity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Error creating activity', error: error.message });
  }
};

// Get all activities with optional filtering by classId
exports.getActivities = async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId && mongoose.Types.ObjectId.isValid(req.query.classId)) {
      filter.classId = req.query.classId;
    }

    const activities = await Activity.find(filter).sort({ date: -1 });
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};

// Get single activity by ID
exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Error fetching activity', error: error.message });
  }
};

// Update activity
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    let updateData = { ...req.body };
    if (req.file) {
      updateData.attachment = `/uploads/activities/${req.file.filename}`;
    }

    const updated = await Activity.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Error updating activity', error: error.message });
  }
};

// Delete activity
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    const deleted = await Activity.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Error deleting activity', error: error.message });
  }
};

// Upload activity attachment (optional)
exports.uploadActivityAttachment = async (req, res) => {
  try {
    const { classId, createdBy, title, date } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!classId || !title || !date) {
      return res.status(400).json({ message: 'classId, title, and date are required for standalone upload' });
    }

    const attachmentPath = `/uploads/activities/${req.file.filename}`;

    const newActivity = new Activity({
      title: title || 'Uploaded File Activity',
      date: date || new Date(),
      attachment: attachmentPath,
      classId,
      createdBy,
      description: req.body.description || 'Uploaded attachment',
      score: req.body.score || 0,
    });

    const saved = await newActivity.save();
    res.status(201).json({ message: 'Upload successful, new activity created', activity: saved });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// Activity Submissions Monitoring
exports.getActivitySubmissionsByTeacher = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const classId = req.query.classId;

    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: 'Invalid Teacher ID format' });
    }
    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid Class ID format' });
    }

    const submissions = await Submission.find({
      activityId: { $in: await Activity.find({ classId: classId }).distinct('_id') },
    })
      .populate({
        path: 'studentId',
        select: 'name email role',
        model: 'User',
      })
      .populate({
        path: 'activityId',
        select: 'title date',
        model: 'Activity',
      })
      .sort({ submissionDate: -1 });

    res.json({ submissions });
  } catch (error) {
    console.error('Error fetching activity submissions:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

// Update activity score
exports.updateActivityScore = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score } = req.body;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: 'Invalid Submission ID format' });
    }
    if (score === undefined || score === null) {
      return res.status(400).json({ message: 'Score is required' });
    }
    const scoreNumber = Number(score);
    if (isNaN(scoreNumber)) {
      return res.status(400).json({ message: 'Score must be a number' });
    }
    if (scoreNumber < 0 || scoreNumber > 100) {
      return res.status(400).json({ message: 'Score must be between 0 and 100' });
    }

    const updatedSubmission = await Submission.findByIdAndUpdate(
      submissionId,
      { score: scoreNumber },
      { new: true, runValidators: true }
    );

    if (!updatedSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error updating submission score:', error);
    res.status(500).json({ message: 'Error updating submission score', error: error.message });
  }
};

// Submit Activity
exports.submitActivity = async (req, res) => {
  try {
    const { activityId, studentId } = req.body;
    let attachmentPath = null;

    if (req.file) {
      attachmentPath = `/uploads/submissions/${req.file.filename}`;
    }

    if (!activityId || !studentId) {
      return res.status(400).json({ message: 'Activity ID and Student ID are required' });
    }

    const submission = new Submission({
      activityId,
      studentId,
      attachment: attachmentPath,
    });

    const savedSubmission = await submission.save();
    res.status(201).json(savedSubmission);
  } catch (error) {
    console.error('Error submitting activity:', error);
    res.status(500).json({ message: 'Error submitting activity', error: error.message });
  }
};

// GET /api/submissions?classId=...&studentId=...
exports.getStudentSubmissions = async (req, res) => {
  try {
    const { classId, studentId } = req.query;
    if (!classId || !studentId) {
      return res.status(400).json({ message: 'classId and studentId are required' });
    }

    const activities = await Activity.find({ classId }).select('_id');
    const activityIds = activities.map(a => a._id);

    const submissions = await Submission.find({
      activityId: { $in: activityIds },
      studentId,
    });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};