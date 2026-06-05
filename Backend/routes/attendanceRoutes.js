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

module.exports = router;