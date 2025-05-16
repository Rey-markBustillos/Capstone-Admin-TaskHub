const Task = require('../models/Task'); // Import Task model
const Class = require('../models/Class'); // Import Class model

// Add a new task to a class
const addTask = async (req, res) => {
  const { description, deadline, points } = req.body;
  const { classId } = req.params; // Get classId from the URL
  const file = req.file ? req.file.filename : null; // Check if file is uploaded

  try {
    // Check if the class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Create a new task for the class
    const newTask = new Task({
      description,
      file,
      deadline,
      points,
      classId, // Associate task with class
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask); // Send back the created task
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all tasks for a class
const getTasks = async (req, res) => {
  try {
    const { classId } = req.params;
    const tasks = await Task.find({ classId }); // Find tasks associated with classId
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task details by task ID
const getTaskById = async (req, res) => {
  const { id } = req.params; // Task ID passed in the URL

  try {
    // Find the task by its ID
    const task = await Task.findById(id).populate('classId', 'className teacherName'); // Populate with class details

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Return task details
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task details', error: error.message });
  }
};

module.exports = { addTask, getTasks, getTaskById };
