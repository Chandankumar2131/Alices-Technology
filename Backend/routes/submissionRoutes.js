const express = require("express");

const router = express.Router();

const {
  createSubmission,
  getMySubmissions,
  updateSubmission,
  getAllSubmissions,
  getSubmissionById,
  deleteSubmission,
} = require("../controller/submissionController");

const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// ==========================================
// EMPLOYEE ROUTES
// ==========================================

// Create Submission
router.post(
  "/create",
  auth,
  createSubmission
);

// Get My Submissions
router.get(
  "/my-submissions",
  auth,
  getMySubmissions
);

// Update Submission Status
router.put(
  "/update/:submissionId",
  auth,
  updateSubmission
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get All Submissions
router.get(
  "/all",
  auth,
  isAdmin,
  getAllSubmissions
);

// Get Single Submission
router.get(
  "/:submissionId",
  auth,
  isAdmin,
  getSubmissionById
);

// Delete Submission
router.delete(
  "/:submissionId",
  auth,
  isAdmin,
  deleteSubmission
);

module.exports = router;