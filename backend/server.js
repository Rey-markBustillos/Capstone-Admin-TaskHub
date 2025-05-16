const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes'); // Import class routes
const taskRoutes = require('./routes/taskRoutes'); // Import task routes

// Load environment variables
dotenv.config();

// Connect to the MongoDB database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());  // Enable Cross-Origin Resource Sharing
app.use(express.json());  // Parse incoming JSON requests

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);  // Use class routes
app.use('/api/tasks', taskRoutes);  // Use task routes

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
