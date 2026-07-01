const express = require("express");

const router = express.Router();

const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  getLeaveById,
  getMyLeaveBucket,
} = require("../controller/leaveController");

const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// ==========================================
// EMPLOYEE ROUTES
// ==========================================

// Apply Leave
router.post(
  "/apply",
  auth,
  applyLeave
);

// Get Logged In Employee's Leaves
router.get(
  "/my-leaves",
  auth,
  getMyLeaves
);

router.get(
  "/my-bucket",
  auth,
  getMyLeaveBucket
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get All Leave Requests
router.get(
  "/all",
  auth,
  isAdmin,
  getAllLeaves
);

// Approve Leave
router.patch(
  "/approve/:leaveId",
  auth,
  isAdmin,
  approveLeave
);

// Reject Leave
router.patch(
  "/reject/:leaveId",
  auth,
  isAdmin,
  rejectLeave
);

// ==========================================
// GET SINGLE LEAVE
// KEEP THIS ROUTE LAST
// ==========================================

router.get(
  "/:leaveId",
  auth,
  getLeaveById
);

module.exports = router;
