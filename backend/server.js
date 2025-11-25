// Load environment variables FIRST before any other imports
const dotenv = require('dotenv');
dotenv.config();

// Debug environment variables
console.log('Environment variables loaded:');
console.log('- PORT:', process.env.PORT || 'undefined');
console.log('- MONGO_URI exists:', !!process.env.MONGO_URI);
if (process.env.MONGO_URI) {
  console.log('- MONGO_URI preview:', process.env.MONGO_URI.substring(0, 30) + '...');
}

const express = require('express');
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
const fileRoutes = require('./routes/fileRoutes');
const moduleRoutes = require('./routes/moduleRoutes');

// ADD: Import submission routes
const submissionRoutes = require('./routes/submissionRoutes');
const visitRoutes = require('./routes/visitRoutes');

// Connect to MongoDB
connectDB().then((connected) => {
  if (connected) {
    console.log('Database: MongoDB connected - using full database functionality');
  } else {
    console.log('Database: Running in fallback mode with mock data');
  }
}).catch((err) => {
  console.error('Database connection error:', err);
  console.log('Continuing in fallback mode...');
});

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      'https://taskhub-for-als.netlify.app', // Netlify frontend
      'http://localhost:5173', // allow local dev too
      'http://localhost:5174', // Vite alternate port
      'http://localhost:5175', // Vite alternate port 2
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  })
);

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  if (req.url.includes('/quizzes/generate')) {
    console.log('📝 Quiz generation request body:', req.body);
  }
  next();
});

app.use(express.json());

// Add timeout middleware for file uploads
app.use('/api/file', (req, res, next) => {
  // Set timeout to 5 minutes for file uploads
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

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

const uploadDirTemp = path.join(__dirname, 'uploads', 'temp');
if (!fs.existsSync(uploadDirTemp)) {
  fs.mkdirSync(uploadDirTemp, { recursive: true });
  console.log('Created uploads/temp directory');
}

const uploadDirModules = path.join(__dirname, 'uploads', 'modules');
if (!fs.existsSync(uploadDirModules)) {
  fs.mkdirSync(uploadDirModules, { recursive: true });
  console.log('Created uploads/modules directory');
}

// Serve static uploads folder with detailed logging
app.use('/uploads', (req, res, next) => {
  console.log('📁 Static file request:', req.path);
  const requestedPath = path.join(__dirname, 'uploads', req.path);
  console.log('📁 Full path:', requestedPath);
  console.log('📁 File exists:', require('fs').existsSync(requestedPath));
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});


app.use('/api/users', userRoutes);
app.use('/api/class', classRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/modules', moduleRoutes);

// Add a simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

// ADD: Mount submission routes (for /api/submissions/student/:studentId)
app.use('/api/submissions', submissionRoutes);

// ADD: Mount visit routes (for /api/visits)
app.use('/api/visits', visitRoutes);

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