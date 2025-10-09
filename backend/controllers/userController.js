const bcrypt = require("bcryptjs");
const User = require("../models/User");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Fallback mock data when MongoDB is not available
let mockUsers = [
  {
    _id: "683528d0d96d82ebb4edf4b2",
    name: "teacher2",
    email: "teacher2@example.com",
    role: "teacher",
    profileImage: null,
    lrn: null
  },
  {
    _id: "683528d0d96d82ebb4edf4b3",
    name: "admin1",
    email: "admin1@example.com",
    role: "admin",
    profileImage: null,
    lrn: null
  },
  {
    _id: "683528d0d96d82ebb4edf4b4",
    name: "student1",
    email: "student1@example.com",
    role: "student",
    profileImage: null,
    lrn: "12345"
  }
];

// Check if MongoDB is available
const isMongoAvailable = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
};

// Helper to remove password before sending user data
const sanitizeUser = (user) => {
  if (typeof user.toObject === 'function') {
    const obj = user.toObject();
    delete obj.password;
    return obj;
  }
  // For mock data (plain objects)
  const obj = { ...user };
  delete obj.password;
  return obj;
};

// GET /api/users - Get all users, optionally filtered by role
exports.getUsers = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      // Use mock data when MongoDB is not available
      const role = req.query.role;
      let users = mockUsers;
      if (role) {
        users = mockUsers.filter(user => user.role === role);
      }
      return res.json(users.map(user => sanitizeUser(user)));
    }

    // MongoDB is available - use normal database queries
    const role = req.query.role;
    let query = {};
    if (role) {
      query.role = role;
    }
    const users = await User.find(query).select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/users - Create a new user (password will be hashed by model)
exports.createUser = async (req, res) => {
  try {
   const { name, email, password, role, lrn, teacherId, adminId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Create a user with specific role
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role,
      lrn: role === "student" ? lrn || null : null,
      teacherId: role === "teacher" ? teacherId : null,
      adminId: role === "admin" ? adminId : null,
      active: true,
    });

    await user.save();
    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/users/:id - Update user fields (hash password if present)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      context: "query",
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/users/:id/toggle - Toggle user's active status
exports.toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.active = !user.active;
    await user.save();

    res.json({ message: `User is now ${user.active ? "active" : "inactive"}` });
  } catch (error) {
    console.error("Toggle active status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/users/:id - Delete user by ID
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/users/add-student - Add a student subdocument to a user
exports.addStudent = async (req, res) => {
  try {
    const { userId, name, subject, time, room } = req.body;

    if (!userId || !name || !subject || !time || !room) {
      return res.status(400).json({ message: "All student fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.students.push({ name, subject, time, room });
    await user.save();

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error("Add student error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/users/login - Authenticate user and respond with user info (no password)
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.active) {
      return res.status(403).json({ message: "User account is inactive" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Profile image upload configuration
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId_timestamp.extension
    const extension = path.extname(file.originalname);
    const filename = `profile_${req.body.userId}_${Date.now()}${extension}`;
    cb(null, filename);
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file types
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed!'));
    }
  }
});

// POST /api/users/upload-profile - Upload profile image
exports.uploadProfile = [
  profileUpload.single('profileImage'),
  async (req, res) => {
    try {
      console.log('Upload profile request received');
      console.log('Body:', req.body);
      console.log('File:', req.file);

      const { userId, userRole } = req.body;

      // Validate user role (only teachers and admins)
      if (!userRole || !['teacher', 'admin'].includes(userRole)) {
        return res.status(403).json({ 
          message: "Only teachers and admins can upload profile images" 
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      let user;
      let isUsingMongo = isMongoAvailable();

      if (!isUsingMongo) {
        // Use mock data when MongoDB is not available
        const userIndex = mockUsers.findIndex(u => u._id === userId);
        if (userIndex === -1) {
          return res.status(404).json({ message: "User not found" });
        }
        user = mockUsers[userIndex];

        // Delete old profile image if exists
        if (user.profileImage) {
          const oldImagePath = path.join(__dirname, '../uploads/profiles', path.basename(user.profileImage));
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('Deleted old profile image:', oldImagePath);
          }
        }

        // Update user with new profile image URL
        const profileImageUrl = `/uploads/profiles/${req.file.filename}`;
        user.profileImage = profileImageUrl;
        mockUsers[userIndex] = user;

        console.log('Profile image updated successfully (mock mode):', profileImageUrl);
      } else {
        // MongoDB is available - use normal database operations
        user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Delete old profile image if exists
        if (user.profileImage) {
          const oldImagePath = path.join(__dirname, '../uploads/profiles', path.basename(user.profileImage));
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        // Update user with new profile image URL
        const profileImageUrl = `/uploads/profiles/${req.file.filename}`;
        user.profileImage = profileImageUrl;
        await user.save();

        console.log('Profile image updated successfully (MongoDB):', profileImageUrl);
      }

      res.json({
        message: "Profile image uploaded successfully",
        profileImageUrl: user.profileImage,
        user: sanitizeUser(user)
      });

    } catch (error) {
      console.error("Profile upload error:", error);
      
      // Delete uploaded file if there was an error
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      res.status(500).json({ message: "Internal server error" });
    }
  }
];

// GET /api/users/profile-image/:userId - Get user profile image
exports.getProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('profileImage');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profileImage) {
      return res.status(404).json({ message: "No profile image found" });
    }

    res.json({ profileImageUrl: user.profileImage });
  } catch (error) {
    console.error("Get profile image error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
