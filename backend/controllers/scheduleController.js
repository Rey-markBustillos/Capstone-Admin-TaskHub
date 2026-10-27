const Activity = require('../models/Activity');
const Class = require('../models/Class');

exports.getTodaySchedule = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    // `students` is a JSONB array in Supabase. Filter it in JavaScript so
    // UUID values are not sent to PostgREST as malformed JSON filter input.
    const allClasses = await Class.find({});
    const classes = allClasses.filter((classItem) =>
      Array.isArray(classItem.students) && classItem.students.some((student) =>
        String(student?._id || student?.id || student) === String(userId)
      )
    );

    // Kunin lahat ng classId
    const classIds = classes.map(cls => cls._id);

    // Hanapin lahat ng activity ngayong araw para sa mga klaseng iyon
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const activities = await Activity.find({
      classId: { $in: classIds },
      date: { $gte: today, $lt: tomorrow }
    }).sort({ date: 1 });

    // Format result with day (weekday)
    const schedule = activities.map(act => ({
      time: act.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      day: act.date.toLocaleDateString('en-US', { weekday: 'long' }),
      title: act.title
    }));

    res.json({ schedule });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
