const Class = require('../models/Class');

const getClasses = async (req, res) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addClass = async (req, res) => {
  try {
    const { teacherName, className, time, roomNumber, profilePic } = req.body;
    const newClass = new Class({ teacherName, className, time, roomNumber, profilePic });
    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getClasses, addClass };
