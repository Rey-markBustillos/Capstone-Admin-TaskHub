const bcrypt = require("bcryptjs");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Mock users for testing without database
let mockUsers = [
  {
    _id: '683528d0d96d82ebb4edf4b2',
    name: 'teacher2',
    email: 'teacher2@example.com',
    role: 'teacher',
    profileImage: null
  }
];

// Helper to remove password before sending user data
const sanitizeUser = (user) => {
  const obj = { ...user };
  delete obj.password;
  return obj;
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

// POST /api/users/upload-profile - Upload profile image (Mock version)
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

      // Find user in mock data
      const userIndex = mockUsers.findIndex(user => user._id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = mockUsers[userIndex];

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

      console.log('Profile image updated successfully:', profileImageUrl);

      res.json({
        message: "Profile image uploaded successfully",
        profileImageUrl: profileImageUrl,
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

// GET /api/users/profile-image/:userId - Get user profile image (Mock version)
exports.getProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = mockUsers.find(user => user._id === userId);
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

// Other mock functions for testing
exports.getUsers = async (req, res) => {
  try {
    res.json(mockUsers.map(user => sanitizeUser(user)));
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createUser = async (req, res) => {
  res.status(501).json({ message: "Not implemented in mock mode" });
};

exports.updateUser = async (req, res) => {
  res.status(501).json({ message: "Not implemented in mock mode" });
};

exports.toggleActiveStatus = async (req, res) => {
  res.status(501).json({ message: "Not implemented in mock mode" });
};

exports.deleteUser = async (req, res) => {
  res.status(501).json({ message: "Not implemented in mock mode" });
};

exports.addStudent = async (req, res) => {
  res.status(501).json({ message: "Not implemented in mock mode" });
};

exports.loginUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};