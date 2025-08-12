const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    unique: true, // Tinitiyak na walang magkakaparehong pangalan ng klase
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Mahalaga: Dapat tumugma sa pangalan ng iyong User model
    required: [true, 'Teacher is required'],
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Mahalaga: Dapat tumugma sa pangalan ng iyong User model
  }],
  time: {
    type: Date,
    default: null,
  },
  roomNumber: {
    type: String,
    trim: true,
    default: 'N/A',
  },
}, {
  timestamps: true, // Awtomatikong nagdaragdag ng createdAt at updatedAt
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class;