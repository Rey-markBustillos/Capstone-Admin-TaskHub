const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try to connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    });
    console.log('MongoDB connected successfully');
    return true;
  } catch (err) {
    console.warn('MongoDB connection failed:', err.message);
    console.log('Continuing without MongoDB - using in-memory storage');
    return false;
  }
};

module.exports = connectDB;
