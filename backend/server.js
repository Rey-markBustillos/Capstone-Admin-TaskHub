const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');
const taskRoutes = require('./routes/taskRoutes');
const studentRoutes = require('./routes/studentRoutes'); // Import student routes
const activityRoutes = require('./routes/activityRoutes'); // Import activity routes

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/students', studentRoutes); // Register student routes here
app.use('/api/activities', activityRoutes); // Register activity routes here

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
