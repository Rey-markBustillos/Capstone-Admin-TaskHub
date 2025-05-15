const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes'); // ✅ Make sure to use the correct filename
const taskRoutes = require('./routes/taskRoutes'); // Import task-related routes

// Load environment variables from .env file
dotenv.config();

// Connect to the MongoDB database
connectDB();

// Initialize Express app
const app = express();

// Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests

// Define routes
app.use('/api/users', userRoutes);  // User-related routes
app.use('/api/classes', classRoutes);  // Class-related routes
app.use('/api/tasks', taskRoutes);  // Task-related routes

// Start the server
const PORT = process.env.PORT || 5000;  // Use the port from .env or default to 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
