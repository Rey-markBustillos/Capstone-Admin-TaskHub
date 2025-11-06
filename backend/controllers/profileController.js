const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Profile = require('../models/Profile');
const User = require('../models/User');

// Configure multer for profile image uploads
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('✅ Created profiles upload directory:', uploadPath);
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: profile_userId_timestamp.extension
    const extension = path.extname(file.originalname);
    const timestamp = Date.now();
    const filename = `profile_${req.body.userId || 'temp'}_${timestamp}${extension}`;
    console.log('📁 Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  console.log('🔍 Checking file type:', file.mimetype);
  
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log('✅ File type accepted');
    return cb(null, true);
  } else {
    console.log('❌ File type rejected');
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = upload.single('profileImage');

// Export multer middleware
exports.uploadSingle = uploadSingle;

// GET /api/profiles/:userId - Get user profile
exports.getProfile = async (req, res) => {
  console.log('🔍 GET PROFILE REQUEST RECEIVED for userId:', req.params.userId);
  try {
    const { userId } = req.params;
    console.log('🔍 Getting profile for user:', userId);

    // MongoDB query
    const profile = await Profile.findOne({ userId }).populate('userId', 'name email role');
    
    if (!profile) {
      console.log('❌ No profile found in database');
      return res.status(404).json({ 
        success: false,
        message: "Profile not found" 
      });
    }

    console.log('✅ Profile found in database:', profile.imageUrl);
    res.json({
      success: true,
      data: {
        _id: profile._id,
        userId: profile.userId,
        imageUrl: profile.imageUrl,
        fullImageUrl: profile.fullImageUrl,
        originalFileName: profile.originalFileName,
        uploadedAt: profile.uploadedAt,
        updatedAt: profile.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error getting profile:', error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message 
    });
  }
};

// POST /api/profiles/upload - Upload profile image
exports.uploadProfile = async (req, res) => {
  console.log('� PROFILE UPLOAD REQUEST RECEIVED!');
  console.log('�📤 Profile upload request started');
  
  uploadSingle(req, res, async function (err) {
    if (err) {
      console.error('❌ Multer error:', err.message);
      return res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }

    try {
      console.log('📋 Request body:', req.body);
      console.log('📁 Uploaded file:', req.file ? 'File received' : 'No file');

      const { userId } = req.body;

      // Validation
      if (!req.file) {
        console.error('❌ No file uploaded');
        return res.status(400).json({ 
          success: false,
          message: "No file uploaded" 
        });
      }

      if (!userId) {
        console.error('❌ No userId provided');
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          success: false,
          message: "User ID is required" 
        });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        console.error('❌ User not found in database:', userId);
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Prepare profile data
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      const profileData = {
        userId: userId,
        imageUrl: imageUrl,
        originalFileName: req.file.originalname,
        fileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date(),
        updatedAt: new Date()
      };

      console.log('💾 Saving profile data:', profileData);

      console.log(' Using MongoDB for profile save');
      
      // Find and delete existing profile
      const existingProfile = await Profile.findOne({ userId });
      if (existingProfile) {
        console.log('🔄 Updating existing profile');
        // Delete old image file
        const oldImagePath = path.join(__dirname, '../uploads/profiles', path.basename(existingProfile.imageUrl));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('🗑️ Deleted old profile image');
        }
        await Profile.deleteOne({ userId });
      }

      // Save new profile
      const profile = new Profile(profileData);
      const savedProfile = await profile.save();
      console.log('✅ Profile saved to MongoDB:', savedProfile._id);

      // Return success response
      const responseData = {
        success: true,
        message: "Profile uploaded successfully",
        data: {
          _id: savedProfile._id,
          userId: savedProfile.userId,
          imageUrl: savedProfile.imageUrl,
          fullImageUrl: `${process.env.SERVER_URL || 'http://localhost:5000'}${savedProfile.imageUrl}`,
          originalFileName: savedProfile.originalFileName,
          uploadedAt: savedProfile.uploadedAt,
          updatedAt: savedProfile.updatedAt
        }
      };

      console.log('✅ Profile upload completed successfully');
      res.json(responseData);

    } catch (error) {
      console.error('❌ Profile upload error:', error);
      
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Cleaned up uploaded file after error');
      }
      
      res.status(500).json({ 
        success: false,
        message: "Internal server error during profile upload",
        error: error.message 
      });
    }
  });
};

// DELETE /api/profiles/:userId - Delete user profile
exports.deleteProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🗑️ Deleting profile for user:', userId);

    // MongoDB deletion
    const profile = await Profile.findOne({ userId });
    
    if (!profile) {
      console.log('❌ No profile found in database');
      return res.status(404).json({ 
        success: false,
        message: "Profile not found" 
      });
    }

    // Delete image file
    const imagePath = path.join(__dirname, '../uploads/profiles', path.basename(profile.imageUrl));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('🗑️ Deleted profile image file');
    }

    await Profile.deleteOne({ userId });
    console.log('✅ Profile deleted from database');

    res.json({
      success: true,
      message: "Profile deleted successfully"
    });

  } catch (error) {
    console.error('❌ Error deleting profile:', error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message 
    });
  }
};

// GET /api/profiles - Get all profiles (admin only)
exports.getAllProfiles = async (req, res) => {
  try {
    console.log('📋 Getting all profiles');

    const profiles = await Profile.find().populate('userId', 'name email role');
    console.log(`✅ Found ${profiles.length} profiles in database`);

    res.json({
      success: true,
      data: profiles,
      count: profiles.length
    });

  } catch (error) {
    console.error('❌ Error getting all profiles:', error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message 
    });
  }
};