const express = require("express");
const { auth } = require("../middleware/auth");
const {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
} = require("../controller/interviewController");

const router = express.Router();

router.post("/", auth, createInterview);
router.get("/", auth, getInterviews);
router.get("/:interviewId", auth, getInterviewById);
router.patch("/:interviewId", auth, updateInterview);

module.exports = router;
