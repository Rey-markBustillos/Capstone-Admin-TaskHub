const Task = require('../models/Task');
const Class = require('../models/Class');

const addTask = async (req, res) => {
  const { description, deadline, points } = req.body;
  const { classId } = req.params;
  const file = req.file ? req.file.filename : null;

  try {
    const classExists = await Class.findById(classId);
    if (!classExists) return res.status(404).json({ message: 'Class not found' });

    const newTask = new Task({ description, file, deadline, points, classId });
    const savedTask = await newTask.save();

    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const { classId } = req.params;
    const tasks = await Task.find({ classId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findById(id).populate('classId', 'className teacherName');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task details', error: error.message });
  }
};

module.exports = { addTask, getTasks, getTaskById };
