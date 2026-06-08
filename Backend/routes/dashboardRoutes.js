const express = require("express");

const router = express.Router();

const {
  getAdminDashboard,
  getLiveEmployees,
  getEmployeeDashboard,
  getDepartmentAnalytics,
  getTodayAttendance,
  getEmployeesOnBreak,
  getLateEmployees,
  getEmployeeTimeline,
} = require("../controller/dashboardController"); 

const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

router.get(
  "/admin",
  auth,
  isAdmin,
  getAdminDashboard
);

router.get(
  "/live-employees",
  auth,
  isAdmin,
  getLiveEmployees
);

router.get(
  "/employee/:employeeId",
  auth,
  isAdmin,
  getEmployeeDashboard
);

router.get(
  "/department-analytics",
  auth,
  isAdmin,
  getDepartmentAnalytics
);

router.get(
  "/today-attendance",
  auth,
  isAdmin,
  getTodayAttendance
);

router.get(
  "/on-break",
  auth,
  isAdmin,
  getEmployeesOnBreak
);

router.get(
  "/late-employees",
  auth,
  isAdmin,
  getLateEmployees
);

router.get(
  "/employee/:employeeId/timeline",
  auth,
  isAdmin,
  getEmployeeTimeline
);

module.exports = router;