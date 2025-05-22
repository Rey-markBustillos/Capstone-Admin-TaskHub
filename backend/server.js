const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Routes
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');
const taskRoutes = require('./routes/taskRoutes');
const studentRoutes = require('./routes/studentRoutes');
const activityRoutes = require('./routes/activityRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

dotenv.config();  // Load environment variables from .env file
connectDB();      // Connect to MongoDB

const app = express();

// Middleware
app.use(cors());           // Enable CORS for all origins (adjust for security in production)
app.use(express.json());   // Parse JSON request bodies

// Serve static files from /uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/users', userRoutes);        // User routes including /login
app.use('/api/classes', classRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/teacher', teacherRoutes);

// 404 handler for any undefined route
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (optional, improves error responses)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
