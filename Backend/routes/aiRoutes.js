const express = require("express");
const { assistant, candidateSummary } = require("../controller/aiController");
const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { aiLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/assistant", auth, aiLimiter, assistant);
router.post(
  "/candidates/:candidateId/summary",
  auth,
  isAdmin,
  aiLimiter,
  candidateSummary
);

module.exports = router;
