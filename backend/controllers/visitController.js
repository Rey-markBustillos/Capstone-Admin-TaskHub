const Visit = require('../models/Visit');

// Record a visit
const recordVisit = async (req, res) => {
  console.log('🔥 recordVisit API called');
  console.log('📝 Request body:', req.body);
  
  try {
    const { page, userId, sessionId } = req.body;
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    
    // Use session ID from request body or generate from headers
    const finalSessionId = sessionId || req.sessionID || req.headers['x-session-id'] || '';

    // For application access visits, check if we already have a visit for this session
    if (page === 'application-access' && finalSessionId) {
      const existingVisit = await Visit.findOne({ 
        sessionId: finalSessionId, 
        page: 'application-access' 
      });
      
      if (existingVisit) {
        return res.status(200).json({
          message: 'Visit already recorded for this session',
          visit: {
            id: existingVisit._id,
            timestamp: existingVisit.timestamp,
            page: existingVisit.page
          }
        });
      }
    }

    const visit = new Visit({
      page,
      userId: userId || null,
      userAgent,
      ipAddress,
      sessionId: finalSessionId
    });

    await visit.save();
    
    res.status(201).json({
      message: 'Visit recorded successfully',
      visit: {
        id: visit._id,
        timestamp: visit.timestamp,
        page: visit.page
      }
    });
  } catch (error) {
    console.error('Error recording visit:', error);
    res.status(500).json({ 
      message: 'Error recording visit', 
      error: error.message 
    });
  }
};

// Get total visits count
const getTotalVisits = async (req, res) => {
  console.log('📊 getTotalVisits API called');
  
  try {
    const totalVisits = await Visit.countDocuments();
    console.log('📊 Total visits count:', totalVisits);
    
    res.json({
      totalVisits,
      message: 'Total visits retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting total visits:', error);
    res.status(500).json({ 
      message: 'Error getting total visits', 
      error: error.message 
    });
  }
};

// Get visits by page
const getVisitsByPage = async (req, res) => {
  try {
    const { page } = req.params;
    const visits = await Visit.countDocuments({ page });
    
    res.json({
      page,
      visits,
      message: 'Page visits retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting page visits:', error);
    res.status(500).json({ 
      message: 'Error getting page visits', 
      error: error.message 
    });
  }
};

// Get visit statistics
const getVisitStatistics = async (req, res) => {
  try {
    const totalVisits = await Visit.countDocuments();
    
    // Get visits by page
    const visitsByPage = await Visit.aggregate([
      {
        $group: {
          _id: '$page',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get visits by date (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentVisits = await Visit.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      totalVisits,
      visitsByPage,
      recentVisits,
      message: 'Visit statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting visit statistics:', error);
    res.status(500).json({ 
      message: 'Error getting visit statistics', 
      error: error.message 
    });
  }
};

// Get daily active users statistics
const getDailyActiveUsers = async (req, res) => {
  console.log('📊 getDailyActiveUsers API called');
  
  try {
    
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

module.exports = {
  recordVisit,
  getTotalVisits,
  getVisitsByPage,
  getVisitStatistics,
  getDailyActiveUsers
};