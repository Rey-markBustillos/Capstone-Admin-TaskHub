const Activity = require('../models/Activity');
const Class = require('../models/Class');
const mongoose = require('mongoose');

// Create activity
exports.createActivity = async (req, res) => {
  try {
    const { title, description, date, score, link, attachment, createdBy, classId } = req.body;

    if (!title || !date || !classId) {
      return res.status(400).json({ message: 'Title, date, and classId are required.' });
    }

    const activity = new Activity({
      title,
      description,
      date,
      score,
      link,
      attachment,
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

    const updated = await Activity.findByIdAndUpdate(id, req.body, {
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

// Upload activity attachment
exports.uploadActivityAttachment = async (req, res) => {
  try {
    const { classId, createdBy, title, date } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!classId || !title || !date) {
      return res.status(400).json({ message: 'classId, title, and date are required' });
    }

    // Save the uploaded file path as relative URL
    const attachmentPath = `/uploads/activities/${req.file.filename}`;

    const newActivity = new Activity({
      title,
      date,
      attachment: attachmentPath,
      classId,
      createdBy,
      description: 'Uploaded attachment',
    });

    const saved = await newActivity.save();

    res.status(201).json({ message: 'Upload successful', activity: saved });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// **New controller method: Activity Submissions Monitoring**
exports.getActivitySubmissionsByTeacher = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    // Find all classes for the teacher
    const classes = await Class.find({ teacherId }).select('_id className');

    if (!classes.length) {
      return res.json({ submissions: [] });
    }

    const classIds = classes.map(c => c._id);

    // Find activities submitted in those classes, populate user and class info
    const submissions = await Activity.find({ classId: { $in: classIds } })
      .populate('createdBy', 'name email')
      .populate('classId', 'className')
      .sort({ date: -1 });

    res.json({ submissions });
  } catch (error) {
    console.error('Error fetching activity submissions:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};
