const express = require("express");
const { auth } = require("../middleware/auth");
const { getMyCandidateAssessments } = require("../controller/assessmentController");
const isAdmin = require("../middleware/isAdmin");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const {
  createCandidate,
  getCandidates,
  getMyCandidateProfile,
  updateCandidate,
  assignCandidate,
  resetCandidatePassword,
  createJobApplication,
  getJobApplications,
  uploadCandidateResume,
  getMyInterviews,
} = require("../controller/candidateController");

const router = express.Router();

router.get("/me", auth, getMyCandidateProfile);
router.get("/applications", auth, getJobApplications);
router.get("/interviews", auth, getMyInterviews);
router.get("/assessments", auth, getMyCandidateAssessments);
router.post("/applications", auth, createJobApplication);
router.get("/", auth, getCandidates);
router.post("/", auth, isSuperAdmin, createCandidate);
router.patch("/:id", auth, isAdmin, updateCandidate);
router.patch("/:id/assign", auth, isAdmin, assignCandidate);
router.post("/:id/reset-password", auth, isSuperAdmin, resetCandidatePassword);
router.post("/:id/resume", auth, isAdmin, uploadCandidateResume);

module.exports = router;
