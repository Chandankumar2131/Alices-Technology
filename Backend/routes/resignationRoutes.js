const express = require("express");
const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { getResignations, reviewResignation, reviewWithdrawal, updateHandover } = require("../controller/resignationController");

const router = express.Router();
router.use(auth, isAdmin);
router.get("/", getResignations);
router.patch("/:employeeId/review", reviewResignation);
router.patch("/:employeeId/withdrawal-review", reviewWithdrawal);
router.patch("/:employeeId/handover", updateHandover);

module.exports = router;
