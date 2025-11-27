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

// Cloudinary storage
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
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => cb(null, true),
});


// ------------------------------------------------------
// 📌 SUBMISSIONS — MUST BE FIRST (prevents /:id conflicts)
// ------------------------------------------------------
router.post('/submit', activityController.submitActivity);
router.get("/submission", activityController.getSubmissionForActivity);
router.get("/submissions", activityController.getSubmissionsForStudentInClass);
router.get("/submissions/teacher/:teacherId", activityController.getActivitySubmissionsByTeacher);
router.put("/submissions/score/:submissionId", activityController.updateActivityScore);
router.delete("/submission/:id", activityController.deleteSubmission);

// Legacy submission routes
router.get("/submission/:id/download", activityController.downloadSubmissionFile);
router.get("/submission/:id/info", activityController.getSubmissionInfo);


// ------------------------------------------------------
// 📌 ACTIVITY CRUD
// ------------------------------------------------------
router.get("/", activityController.getActivities); // Get all activities
router.post("/", uploadActivity.single("attachment"), activityController.createActivity); // Create new activity
router.put("/:id", uploadActivity.single("attachment"), activityController.updateActivity); // Update activity
router.delete("/:id", activityController.deleteActivity); // Delete activity

// ------------------------------------------------------
// 📌 Lock / Unlock Activity
// ------------------------------------------------------
router.patch("/:id/lock", activityController.toggleActivityLock);


// ------------------------------------------------------
// 📌 Download activity attachment
// ------------------------------------------------------
router.get("/:id/download", activityController.downloadActivityAttachment);


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
// 📌 FINAL — MUST BE LAST
// ------------------------------------------------------
router.get("/:id", activityController.getActivityById);

module.exports = router;
