const Visit = require('../models/Visit');

// Record a visit
const recordVisit = async (req, res) => {
  try {
    const { page, userId } = req.body;
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    
    // Generate or get session ID from request
    const sessionId = req.sessionID || req.headers['x-session-id'] || '';

    const visit = new Visit({
      page,
      userId: userId || null,
      userAgent,
      ipAddress,
      sessionId
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
  try {
    const totalVisits = await Visit.countDocuments();
    
    res.json({
      totalVisits,
      message: 'Total visits retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting total visits:', error);
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

module.exports = {
  recordVisit,
  getTotalVisits,
  getVisitsByPage,
  getVisitStatistics
};