const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Routes
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');
const activityRoutes = require('./routes/activityRoutes'); // Added activity routes (if you use activities)

dotenv.config(); // Load environment variables from .env file

// Connect to MongoDB with error handling
connectDB().catch((err) => {
  console.error('MongoDB connection failed:', err);
  process.exit(1); // Exit on DB connection failure
});

const app = express();

// Middleware
app.use(cors()); // Enable CORS (configure origins in production)
app.use(express.json()); // Parse JSON bodies

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/activities', activityRoutes); // Mount activity routes if available

// 404 handler (for undefined routes)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (with environment check)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
