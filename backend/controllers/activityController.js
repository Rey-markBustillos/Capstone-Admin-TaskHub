const Activity = require('../models/Activity');
const path = require('path');
const fs = require('fs');

const createActivity = async (req, res) => {
  try {
    // Multer saves the file info in req.file
    const { title, instructions, deadline, classId, className, points } = req.body;

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

    res.status(201).json(savedActivity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating activity', error: error.message });
  }
};

// You can add other CRUD controllers here...

module.exports = { createActivity };
