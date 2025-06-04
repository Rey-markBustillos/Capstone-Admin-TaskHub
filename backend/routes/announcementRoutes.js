const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');

// Create announcement
router.post('/', announcementController.createAnnouncement);

// Get all announcements
router.get('/', announcementController.getAllAnnouncements);

// Get one announcement by ID
router.get('/:id', announcementController.getAnnouncementById);

// Update announcement by ID
router.put('/:id', announcementController.updateAnnouncement);

// Delete announcement by ID
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router;
