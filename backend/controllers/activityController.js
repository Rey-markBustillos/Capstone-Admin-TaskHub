const Activity = require('../models/Activity');

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

const getActivitiesByClass = async (req, res) => {
  try {
    const classId = req.query.classId;
    if (!classId) return res.status(400).json({ message: 'classId query parameter required' });

    const activities = await Activity.find({ classId }).lean();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};

module.exports = { createActivity, getActivitiesByClass };
