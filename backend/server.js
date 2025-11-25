
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

// ...existing code...
const app = express();

// Body parsers (must be before routes)
app.use(express.json({ limit: '2mb' })); // limit can be increased if needed
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// CORS - add deployed frontend origins (adjust as needed)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://capstone-admin-task-hub-jske.vercel.app',
  'https://capstone-admin-taskhub-2.onrender.com',
  'https://taskhub-for-als.netlify.app'
];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  credentials: true
}));

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} → ${req.method} ${req.originalUrl}`);
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    // avoid logging very large bodies
    try {
      const bodyPreview = JSON.stringify(req.body);
      console.log('  headers.content-type:', req.headers['content-type']);
      console.log('  body:', bodyPreview.length > 200 ? bodyPreview.substring(0,200) + '... (truncated)' : bodyPreview);
    } catch (e) {
      console.log('  body: <unserializable>');
    }
  } else if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    console.log('  body: <multipart/form-data>');
  }
  next();
});

// Add timeout middleware for file uploads path
app.use('/api/file', (req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  next();
});

// Ensure uploads directories exist
const ensureDir = (p) => {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
    console.log(`Created ${p}`);
  }
};
ensureDir(path.join(__dirname, 'uploads', 'activities'));
ensureDir(path.join(__dirname, 'uploads', 'submissions'));
ensureDir(path.join(__dirname, 'uploads', 'temp'));
ensureDir(path.join(__dirname, 'uploads', 'modules'));

// Serve static uploads folder with logging
app.use('/uploads', (req, res, next) => {
  console.log('📁 Static file request:', req.path);
  const requestedPath = path.join(__dirname, 'uploads', req.path);
  console.log('📁 Full path:', requestedPath);
  console.log('📁 Exists:', fs.existsSync(requestedPath));
  next();
}, express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/modules', moduleRoutes);

// mount fileRoutes if it exposes upload endpoints
if (fileRoutes) {
  app.use('/api/file', fileRoutes);
}

// submission and visits
app.use('/api/submissions', submissionRoutes);
app.use('/api/visits', visitRoutes);

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', err && err.stack ? err.stack : err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : (err.message || err),
    from: 'global-error-handler'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
