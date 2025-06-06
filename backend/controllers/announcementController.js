const Announcement = require('../models/Announcement');
const mongoose = require('mongoose');

// Create a new announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, postedBy } = req.body;

    if (!title || !content || !postedBy) {
      return res.status(400).json({ message: 'Title, content, and postedBy are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(postedBy)) {
      return res.status(400).json({ message: 'Invalid postedBy user ID' });
    }

    const newAnnouncement = new Announcement({ title, content, postedBy });
    const saved = await newAnnouncement.save();

    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement', error: error.message });
  }
};

// Get all announcements, optionally filtered by postedBy and sorted by datePosted desc
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { postedBy } = req.query;
    let filter = {};
    if (postedBy && mongoose.Types.ObjectId.isValid(postedBy)) {
      filter.postedBy = postedBy;
    }

    const announcements = await Announcement.find(filter)
      .populate('postedBy', 'name email')
      .sort({ datePosted: -1 });

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements', error: error.message });
  }
};

// Get announcement by ID
exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid announcement ID' });
    }
    const announcement = await Announcement.findById(id).populate('postedBy', 'name email');
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ message: 'Failed to fetch announcement', error: error.message });
  }
};

// Update announcement by ID
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid announcement ID' });
    }

    const updated = await Announcement.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: 'Announcement not found' });

    res.json(updated);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Failed to update announcement', error: error.message });
  }
};

// Delete announcement by ID
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid announcement ID' });
    }

    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Announcement not found' });

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement', error: error.message });
  }
};