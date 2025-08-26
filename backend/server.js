console.log("[Startup] server.js is running. If you see this, logging works.");
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');



// Routes
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');
const activityRoutes = require('./routes/activityRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const scheduleRoutes = require('./routes/schedule');
const attendanceRoutes = require('./routes/AttendanceRoutes');
const quizRoutes = require('./routes/quizRoutes');

// ADD: Import submission routes
const submissionRoutes = require('./routes/submissionRoutes');

dotenv.config();

// Connect to MongoDB
connectDB().catch((err) => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      'https://capstone-admin-task-hub-jske.vercel.app',
      'http://localhost:5173', // allow local dev too
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  })
);
app.use(express.json());

// Ensure uploads folder exists
const uploadDirActivities = path.join(__dirname, 'uploads', 'activities');
if (!fs.existsSync(uploadDirActivities)) {
  fs.mkdirSync(uploadDirActivities, { recursive: true });
  console.log('Created uploads/activities directory');
}

const uploadDirSubmissions = path.join(__dirname, 'uploads', 'submissions');
if (!fs.existsSync(uploadDirSubmissions)) {
  fs.mkdirSync(uploadDirSubmissions, { recursive: true });
  console.log('Created uploads/submissions directory');
}

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Mount routes


app.use('/api/users', userRoutes);
app.use('/api/class', classRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/quizzes', quizRoutes);
// ADD: Mount submission routes (for /api/submissions/student/:studentId)
app.use('/api/submissions', submissionRoutes);

// 404 handler (keep this AFTER all routes)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (keep this LAST)
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message,
    stack: err.stack,
    from: 'global-error-handler'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});