const express = require("express");

const router = express.Router();

// Controllers
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAttendanceByMonth,
  getAttendanceSummary,
  getAllAttendance,
  getEmployeeAttendance,
  requestCheckInCorrection,
  getMyCorrectionRequests,
  getAllCorrectionRequests,
  approveCorrectionRequest,
  rejectCorrectionRequest,
  markHalfDayAsPresent,
} = require("../controller/attendanceController");

// Middleware
const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// ==========================================
// EMPLOYEE ROUTES
// ==========================================

// Check In
router.post(
  "/checkin",
  auth,
  checkIn
);

// Check Out
router.post(
  "/checkout",
  auth,
  checkOut
);

// Get Attendance History
router.get(
  "/my-attendance",
  auth,
  getMyAttendance
);

// Monthly Attendance Calendar
router.get(
  "/month",
  auth,
  getAttendanceByMonth
);

// Attendance Summary Dashboard
router.get(
  "/summary",
  auth,
  getAttendanceSummary
);

// Request Check-In Correction
router.post(
  "/corrections",
  auth,
  requestCheckInCorrection
);

// My Check-In Correction Requests
router.get(
  "/corrections/my",
  auth,
  getMyCorrectionRequests
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// All Employees Attendance
router.get(
  "/all",
  auth,
  isAdmin,
  getAllAttendance
);

// Single Employee Attendance
router.get(
  "/employee/:employeeId",
  auth,
  isAdmin,
  getEmployeeAttendance
);

// All Check-In Correction Requests
router.get(
  "/corrections/all",
  auth,
  isAdmin,
  getAllCorrectionRequests
);

// Approve Check-In Correction
router.patch(
  "/corrections/approve/:requestId",
  auth,
  isAdmin,
  approveCorrectionRequest
);

// Reject Check-In Correction
router.patch(
  "/corrections/reject/:requestId",
  auth,
  isAdmin,
  rejectCorrectionRequest
);

// Mark Half Day as Present
router.patch(
  "/override/mark-present/:attendanceId",
  auth,
  isAdmin,
  markHalfDayAsPresent
);

module.exports = router;
