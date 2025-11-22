const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Helper to remove password before sending user data
const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

// GET /api/users - Get all users, optionally filtered by role
exports.getUsers = async (req, res) => {
  try {
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

// Get daily active users statistics
exports.getDailyActiveUsers = async (req, res) => {
  console.log('📊 getDailyActiveUsers API called');
  
  try {
    const Visit = require('../models/Visit');
    
    // Get last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Generate array of last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    // Get visits with user info for the last 7 days
    const dailyUserActivity = await Visit.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo },
          userId: { $ne: null }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
            },
            userId: '$userId',
            role: '$user.role'
          }
        }
      },
      {
        $group: {
          _id: {
            date: '$_id.date',
            role: '$_id.role'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          students: {
            $sum: {
              $cond: [{ $eq: ['$_id.role', 'student'] }, '$count', 0]
            }
          },
          teachers: {
            $sum: {
              $cond: [{ $eq: ['$_id.role', 'teacher'] }, '$count', 0]
            }
          },
          admins: {
            $sum: {
              $cond: [{ $eq: ['$_id.role', 'admin'] }, '$count', 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create a map for easier lookup
    const activityMap = {};
    dailyUserActivity.forEach(day => {
      activityMap[day._id] = {
        students: day.students,
        teachers: day.teachers,
        admins: day.admins
      };
    });

    // Fill in missing days with zeros
    const chartData = {
      labels: last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      students: last7Days.map(date => activityMap[date]?.students || 0),
      teachers: last7Days.map(date => activityMap[date]?.teachers || 0),
      admins: last7Days.map(date => activityMap[date]?.admins || 0)
    };

    console.log('📊 Daily active users data:', chartData);

    res.json({
      chartData,
      totalDays: 7,
      message: 'Daily active users retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting daily active users:', error);
    res.status(500).json({ 
      message: 'Error getting daily active users', 
      error: error.message 
    });
  }
};
