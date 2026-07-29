const express = require("express");
const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { getResignations, reviewResignation, updateHandover } = require("../controller/resignationController");

const router = express.Router();
router.use(auth, isAdmin);
router.get("/", getResignations);
router.patch("/:employeeId/review", reviewResignation);
router.patch("/:employeeId/handover", updateHandover);

module.exports = router;
