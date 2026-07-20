const express = require("express");
const { auth } = require("../middleware/auth");
const { createAssessment, getAssessments, updateAssessment } = require("../controller/assessmentController");

const router = express.Router();
router.get("/", auth, getAssessments);
router.post("/", auth, createAssessment);
router.patch("/:assessmentId", auth, updateAssessment);

module.exports = router;
