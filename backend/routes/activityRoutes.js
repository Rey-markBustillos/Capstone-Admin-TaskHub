const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// --- Multer / Cloudinary Setup ---
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for activity attachments
const activityCloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "taskhub/activities",
    public_id: (req, file) => `activity-${Date.now()}`,
    resource_type: "auto",
  },
});

const uploadActivity = multer({
  storage: activityCloudinaryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => cb(null, true),
});


// ------------------------------------------------------
// 🔥 ROUTES — ORDER MATTERS!
// ------------------------------------------------------

// ------------------------------------------------------
// 📌 Activity CRUD
// ------------------------------------------------------
router.get("/", activityController.getActivities);
router.post("/", uploadActivity.single("attachment"), activityController.createActivity);
router.put("/:id", uploadActivity.single("attachment"), activityController.updateActivity);
router.delete("/:id", activityController.deleteActivity);

// ------------------------------------------------------
// 📌 Lock / Unlock activity
// ------------------------------------------------------
router.patch("/:id/lock", activityController.toggleActivityLock);

// ------------------------------------------------------
// 📌 Upload / View Activity Attachments
// ------------------------------------------------------
router.get("/:id/download", activityController.downloadActivityAttachment);

// ------------------------------------------------------
// 📌 SUBMISSIONS (Must come BEFORE /:id routes)
// ------------------------------------------------------

// Student submits activity
router.post("/submit", activityController.submitActivity);

// Get single submission (prevent conflict with /:id)
router.get("/submission", activityController.getSubmissionForActivity);

// Student fetches all submissions for their class
router.get("/submissions", activityController.getSubmissionsForStudentInClass);

// Teacher fetches submissions for monitoring
router.get("/submissions/teacher/:teacherId", activityController.getActivitySubmissionsByTeacher);

// Update score
router.put("/submissions/score/:submissionId", activityController.updateActivityScore);

// Delete submission
router.delete("/submission/:id", activityController.deleteSubmission);

// Legacy routes (download submission file)
router.get("/submission/:id/download", activityController.downloadSubmissionFile);
router.get("/submission/:id/info", activityController.getSubmissionInfo);

// ------------------------------------------------------
// 📌 Resubmission (Legacy Support)
// ------------------------------------------------------
router.options("/resubmit/:id", (req, res) => {
  res.header("Access-Control-Allow-Origin", "https://capstone-admin-task-hub-jske.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

router.put("/resubmit/:id", activityController.resubmitActivity);

// ------------------------------------------------------
// 📌 SINGLE ACTIVITY (must always be last)
// ------------------------------------------------------
router.get("/:id", activityController.getActivityById);

module.exports = router;
