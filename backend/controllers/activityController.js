const Activity = require('../models/Activity');
const Class = require('../models/Class');
const Submission = require('../models/Submission');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Debug function for file uploads
function logFileDebug(req, context = "") {
  if (!req.file) {
    console.log(`[DEBUG][${context}] No file uploaded.`);
    return;
  }
  console.log(`[DEBUG][${context}] File upload info:`);
  console.log("  originalname:", req.file.originalname);
  console.log("  mimetype:", req.file.mimetype);
  console.log("  path:", req.file.path);
  console.log("  filename:", req.file.filename);
  console.log("  url:", req.file.url);
  console.log("  secure_url:", req.file.secure_url);
  console.log("  public_id:", req.file.public_id);
  console.log("  resource_type (should be raw for non-image):", /\.(pdf|docx?|pptx?|xlsx?)$/i.test(req.file.originalname) ? "raw" : "image");
}

// ============================
// Create activity (UPDATED)
// ============================
exports.createActivity = async (req, res) => {
  logFileDebug(req, "createActivity");
  try {
    const { title, description, date, totalPoints, link, createdBy, classId } = req.body;
    let attachmentPath = null;

    if (req.file) {
      // CRITICAL: Validate Cloudinary URL is not null/undefined
      attachmentPath = req.file.secure_url || req.file.url || req.file.path || req.file.filename || null;
      if (!attachmentPath) {
        console.error('[ERROR] File upload to Cloudinary failed - no URL returned', req.file);
        return res.status(400).json({ message: 'File upload failed. Please try again.' });
      }
      console.log(`[SUCCESS] File uploaded to Cloudinary: ${attachmentPath}`);
    }

    if (!title || !date || !classId) {
      return res.status(400).json({ message: 'Title, date, and classId are required.' });
    }

    const activity = new Activity({
      title,
      description,
      date,
      score: totalPoints,
      link,
      attachment: attachmentPath,
      createdBy,
      classId,
    });

    const savedActivity = await activity.save();
    res.status(201).json(savedActivity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Error creating activity', error: error.message });
  }
};

// ============================
// Get all activities
// ============================
exports.getActivities = async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId && mongoose.Types.ObjectId.isValid(req.query.classId)) {
      filter.classId = req.query.classId;
    }

    const activities = await Activity.find(filter).sort({ date: -1 });
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};

// ============================
// Get single activity
// ============================
exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Error fetching activity', error: error.message });
  }
};

// ============================
// Update activity (UPDATED)
// ============================
exports.updateActivity = async (req, res) => {
  logFileDebug(req, "updateActivity");
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    let updateData = { ...req.body };
    if (req.file) {
      updateData.attachment = req.file.secure_url || req.file.url || req.file.path || req.file.filename || null;
      if (!attachmentPath) {
        console.error('[ERROR] File upload to Cloudinary failed - no URL returned', req.file);
        return res.status(400).json({ message: 'File upload failed. Please try again.' });
      }
      console.log(`[SUCCESS] File uploaded to Cloudinary: ${attachmentPath}`);
    }

    const updated = await Activity.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Error updating activity', error: error.message });
  }
};

// ============================
// Delete activity
// ============================
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    await Submission.deleteMany({ activityId: id });

    const deleted = await Activity.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json({ message: 'Activity and associated submissions deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Error deleting activity', error: error.message });
  }
};

// ============================
// Toggle Lock/Unlock Activity
// ============================
exports.toggleActivityLock = async (req, res) => {
  try {
    const { id } = req.params;
    const { isLocked } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    if (typeof isLocked !== 'boolean') {
      return res.status(400).json({ message: 'isLocked must be a boolean value' });
    }

    const updated = await Activity.findByIdAndUpdate(
      id,
      { isLocked },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json({ 
      message: `Activity ${isLocked ? 'locked' : 'unlocked'} successfully`, 
      activity: updated 
    });
  } catch (error) {
    console.error('Error toggling activity lock:', error);
    res.status(500).json({ message: 'Error toggling activity lock', error: error.message });
  }
};

// ============================
// Teacher Activity Submissions
// ============================
exports.getActivitySubmissionsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { classId } = req.query;

    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: 'Valid Teacher ID is required' });
    }

    let activityIds = [];
    if (classId) {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ message: 'Invalid classId format' });
      }
      const targetClass = await Class.findOne({ _id: classId, teacher: teacherId });
      if (!targetClass) {
        return res.status(403).json({ message: 'Access denied or class not found.' });
      }
      const activitiesInClass = await Activity.find({ classId: classId }).select('_id');
      activityIds = activitiesInClass.map(activity => activity._id);
    } else {
      const teacherClasses = await Class.find({ teacher: teacherId }).select('_id');
      const classIds = teacherClasses.map(cls => cls._id);
      const activities = await Activity.find({ classId: { $in: classIds } }).select('_id');
      activityIds = activities.map(activity => activity._id);
    }

    const submissions = await Submission.find({ activityId: { $in: activityIds } })
      .populate('studentId', 'name email')
      .populate('activityId', 'title date')
      .sort({ submissionDate: -1 });

    const host = `${req.protocol}://${req.get('host')}`;
    const submissionsWithUrl = submissions.map(s => ({
      ...s.toObject(),
      fileUrl: s.filePath ? `${host}/${s.filePath.replace(/\\/g, '/')}` : null
    }));

    res.json({ submissions: submissionsWithUrl });
  } catch (error) {
    console.error('Error fetching activity submissions:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

// ============================
// Get all submissions for a student in a class
// ============================
exports.getSubmissionsForStudentInClass = async (req, res) => {
  try {
    const { classId, studentId } = req.query;

    if (!classId || !studentId) {
      return res.status(400).json({ message: 'classId and studentId are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid classId or studentId.' });
    }

    const activities = await Activity.find({ classId });
    const activityIds = activities.map(a => a._id);

    const submissions = await Submission.find({
      activityId: { $in: activityIds },
      studentId: studentId
    });

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

// ============================
// Update activity score
// ============================
exports.updateActivityScore = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score } = req.body;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: 'Invalid Submission ID format' });
    }
    if (score === undefined || score === null) {
      return res.status(400).json({ message: 'Score is required' });
    }
    const scoreNumber = Number(score);
    if (isNaN(scoreNumber)) {
      return res.status(400).json({ message: 'Score must be a number' });
    }

    const updatedSubmission = await Submission.findByIdAndUpdate(
      submissionId,
      { score: scoreNumber, status: 'Graded' },
      { new: true, runValidators: true }
    );

    if (!updatedSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error updating submission score:', error);
    res.status(500).json({ message: 'Error updating submission score', error: error.message });
  }
};

// ===========================
//   SUBMIT ACTIVITY CONTROLLER (UPDATED FOR FILE-ONLY SUBMISSION)
// ===========================
exports.submitActivity = async (req, res) => {
  try {
    const body = req.body || {};
    const { activityId, studentId, content, submittedAt } = body;

    // Accept if file is present OR content is present
    if (!activityId || !studentId || (!content && !req.file)) {
      return res.status(400).json({
        message: 'Activity ID, Student ID, and either content or file are required.',
        received: body
      });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found.' });
    }

    if (activity.isLocked) {
      return res.status(403).json({
        message: 'This activity is locked and no longer accepts submissions.'
      });
    }

    const existingSubmission = await Submission.findOne({ activityId, studentId });
    if (existingSubmission) {
      return res.status(409).json({
        message: 'You have already submitted this activity. Please use the resubmit option.'
      });
    }

    // Prepare submission data
    const submissionData = {
      activityId,
      studentId,
      submissionDate: submittedAt || new Date(),
      status: 'Submitted',
      score: null
    };

    // If file is present, add file info
    if (req.file) {
      submissionData.filePath = req.file.secure_url || req.file.url || req.file.path || req.file.filename;
      submissionData.fileName = req.file.originalname;
      submissionData.cloudinaryUrl = req.file.secure_url || req.file.url || req.file.path || req.file.filename;
      submissionData.cloudinaryPublicId = req.file.public_id;
      submissionData.fileType = req.file.mimetype;
      submissionData.fileSize = req.file.size;
    }

    // If content is present, add content
    if (content) {
      submissionData.content = content;
    }

    const submission = new Submission(submissionData);
    const savedSubmission = await submission.save();

    return res.status(201).json({
      message: 'Submission saved!',
      submission: savedSubmission
    });

  } catch (error) {
    console.error('❌ Error submitting activity:', error);

    return res.status(500).json({
      message: 'Error submitting activity',
      error: error.message
    });
  }
};
// ============================
// Resubmit Activity
// ============================
exports.resubmitActivity = async (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://capstone-admin-task-hub-jske.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file was uploaded for resubmission.' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Submission ID.' });
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    const activity = await Activity.findById(submission.activityId);
    if (activity && activity.isLocked) {
      return res.status(403).json({ message: 'This activity is locked and no longer accepts resubmissions.' });
    }

    const updatedSubmission = await Submission.findByIdAndUpdate(
      id,
      {
        filePath: req.file.secure_url || req.file.url || req.file.path || req.file.filename,
        fileName: req.file.originalname,
        cloudinaryUrl: req.file.secure_url || req.file.url || req.file.path || req.file.filename,
        cloudinaryPublicId: req.file.public_id,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        submissionDate: new Date(),
        status: 'Resubmitted',
        score: null,
      },
      { new: true }
    );

    if (!updatedSubmission) {
      return res.status(404).json({ message: 'Submission not found to update.' });
    }

    res.status(200).json(updatedSubmission);
  } catch (error) {
    console.error('Error resubmitting activity:', error);
    res.status(500).json({ message: 'Error resubmitting activity', error: error.message });
  }
};

// ============================
// Delete submission
// ============================
exports.deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Submission ID.' });
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (submission.filePath) {
      const filePath = path.join(__dirname, '..', submission.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete submission file from disk:', err);
        });
      }
    }

    await Submission.findByIdAndDelete(id);
    res.status(200).json({ message: 'Submission deleted successfully.' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ message: 'Error deleting submission', error: error.message });
  }
};

// ============================
// Get submission for activity
// ============================
exports.getSubmissionForActivity = async (req, res) => {
  try {
    const { activityId, studentId } = req.query;
    if (!activityId || !studentId) {
      return res.status(400).json({ message: 'activityId and studentId are required query parameters.' });
    }

    const submission = await Submission.findOne({ activityId, studentId });
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching single submission:', error);
    res.status(500).json({ message: 'Error fetching submission', error: error.message });
  }
};

// ============================
// Get all submissions for student
// ============================
exports.getStudentSubmissions = async (req, res) => {
  try {
    const { studentId } = req.params;

    const submissions = await Submission.find({ studentId })
      .populate("activityId", "title description dueDate")
      .sort({ submissionDate: -1 });

    const formatted = submissions.map((s) => ({
      ...s.toObject(),
      fileUrl: s.filePath
        ? `${req.protocol}://${req.get("host")}/${s.filePath}`
        : null,
    }));

    res.json({ submissions: formatted });
  } catch (error) {
    console.error('❌ [getStudentSubmissions] Error fetching submissions:', error);
    res.status(500).json({ message: "Error fetching submissions", error: error.message });
  }
};

// ============================
// Download Activity Attachment
// ============================
exports.downloadActivityAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }

    const activity = await Activity.findById(id);
    if (!activity || !activity.attachment) {
      return res.status(404).json({ message: 'Attachment not found for this activity.' });
    }

    console.log(`[DEBUG] Downloading attachment for activity ${id}: ${activity.attachment}`);

    // If attachment is a Cloudinary URL, proxy it directly with proper headers
    if (activity.attachment.startsWith('http://') || activity.attachment.startsWith('https://')) {
      try {
        const axios = require('axios');
        
        // Build the URL with proper transformation for inline viewing
        let fileUrl = activity.attachment;
        
        // For PDFs, ensure inline transformation is applied
        if (fileUrl.includes('.pdf')) {
          if (fileUrl.includes('/upload/')) {
            fileUrl = fileUrl.replace('/upload/', '/upload/fl_attachment:inline/');
          } else if (fileUrl.includes('cloudinary.com')) {
            // Fallback if URL structure is different
            fileUrl = fileUrl + '?fl_attachment:inline';
          }
        }
        
        console.log(`[DEBUG] Fetching from Cloudinary: ${fileUrl}`);
        
        // Fetch the file from Cloudinary with timeout
        const response = await axios.get(fileUrl, {
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        });
        
        // Determine content type
        let contentType = response.headers['content-type'];
        if (!contentType) {
          if (fileUrl.includes('.pdf')) contentType = 'application/pdf';
          else if (fileUrl.includes('.doc')) contentType = 'application/msword';
          else if (fileUrl.includes('.png')) contentType = 'image/png';
          else if (fileUrl.includes('.jpg') || fileUrl.includes('.jpeg')) contentType = 'image/jpeg';
          else contentType = 'application/octet-stream';
        }
        
        // Set response headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Log successful header setup
        console.log(`[DEBUG] Headers set. Content-Type: ${contentType}, Disposition: inline`);
        
        // Pipe the stream to response
        response.data.pipe(res);
        
        // Handle stream errors
        response.data.on('error', (err) => {
          console.error(`[ERROR] Stream error:`, err.message);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to stream file' });
          } else {
            res.end();
          }
        });
        
        // Handle response errors
        res.on('error', (err) => {
          console.error(`[ERROR] Response error:`, err.message);
          response.data.destroy();
        });
        
      } catch (error) {
        console.error(`[ERROR] Failed to proxy Cloudinary file:`, error.message);
        console.error(`[ERROR] Stack:`, error.stack);
        
        if (!res.headersSent) {
          return res.status(500).json({ 
            message: 'Failed to fetch file from cloud storage', 
            error: error.message 
          });
        }
      }
    } else {
      // For local files
      const filePath = path.join(__dirname, '..', activity.attachment);
      console.log(`[DEBUG] Serving local file: ${filePath}`);
      if (fs.existsSync(filePath)) {
        res.download(filePath, path.basename(activity.attachment));
      } else {
        res.status(404).json({ message: 'File not found on server.' });
      }
    }
  } catch (error) {
    console.error('Error downloading activity attachment:', error.message);
    console.error('[ERROR] Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error downloading file', error: error.message });
    }
  }
};

// ============================
// Download Submission File
// ============================
exports.downloadSubmissionFile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (submission.cloudinaryUrl) {
      return res.redirect(submission.cloudinaryUrl);
    }
    
    if (!submission.filePath) {
      return res.status(404).json({ message: 'No file associated with this submission.' });
    }

    let filePath;
    if (submission.filePath.startsWith('uploads/')) {
      filePath = path.join(__dirname, '..', submission.filePath);
    } else if (submission.filePath.startsWith('./uploads/')) {
      filePath = path.join(__dirname, '..', submission.filePath.substring(2));
    } else {
      filePath = path.join(__dirname, '..', 'uploads', 'submissions', submission.filePath);
    }

    if (fs.existsSync(filePath)) {
      res.download(filePath, submission.fileName || path.basename(filePath));
    } else {
      res.status(404).json({ 
        message: 'File not found on server.',
        submissionId: id,
        filePath: submission.filePath,
        cloudinaryUrl: submission.cloudinaryUrl || null
      });
    }
  } catch (error) {
    console.error('Error downloading submission file:', error);
    res.status(500).json({ message: 'Error downloading file', error: error.message });
  }
};

exports.exportScores = async (req, res) => {
  try {
    const { classId } = req.query;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }

    const activities = await Activity.find({ classId }).sort({ date: 1 });
    const targetClass = await Class.findById(classId).populate('students', 'name email');
    if (!targetClass) return res.status(404).json({ message: 'Class not found' });

    const activityIds = activities.map(a => a._id);
    const submissions = await Submission.find({ activityId: { $in: activityIds } });

    const studentScores = {};
    submissions.forEach(sub => {
      if (!studentScores[sub.studentId]) studentScores[sub.studentId] = {};
      studentScores[sub.studentId][sub.activityId] = sub.score;
    });

    const exportData = targetClass.students.map(student => {
      const row = { Name: student.name, Email: student.email };
      activities.forEach(act => {
        row[act.title] = studentScores[student._id]?.[act._id] ?? '';
      });
      return row;
    });

    res.json({ exportData, activityTitles: activities.map(a => a.title) });
  } catch (error) {
    console.error('Error exporting scores:', error);
    res.status(500).json({ message: 'Error exporting scores', error: error.message });
  }
};

// ============================
// Submission Info (for route: /submission/:id/info)
// ============================
exports.getSubmissionInfo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid submission ID.' });
    }
    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission info:', error);
    res.status(500).json({ message: 'Error fetching submission info', error: error.message });
  }
};
