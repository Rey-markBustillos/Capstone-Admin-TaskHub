const Class = require('../models/Class');
const Activity = require('../models/Activity');
const Submission = require('../models/Submission');

const getStats = async (req, res) => {
  try {
    // Total classes in the system
    const totalClasses = await Class.countDocuments();

    // Total assignments (activities)
    const totalAssignments = await Activity.countDocuments();

    // Total submissions
    const totalSubmissions = await Submission.countDocuments();

    // Pending grading = submissions with status 'submitted' but not graded
    // Assuming you have a 'graded' field in Submission (boolean)
    // If no graded field, adjust logic accordingly
    const pendingGrading = await Submission.countDocuments({ status: 'submitted', graded: { $ne: true } });

    res.json({
      totalClasses,
      totalAssignments,
      totalSubmissions,
      pendingGrading,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    // For simplicity, returning some example notifications based on recent activities
    // You can customize based on your DB schema and logic
    const recentActivities = await Activity.find()
      .sort({ deadline: 1 })
      .limit(5)
      .lean();

    const notifications = recentActivities.map((act, idx) => ({
      id: idx + 1,
      message: `Upcoming deadline for "${act.title}" in class "${act.className}" on ${new Date(act.deadline).toLocaleDateString()}`,
      date: act.deadline,
    }));

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

module.exports = { getStats, getNotifications };
