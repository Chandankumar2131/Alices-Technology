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
  getEmployeeDayDetail,
  getMyDayDetail,
  getEmployeeDetailForAdmin
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
router.get(
  "/employee/:employeeId/day/:date",
  auth,
  isAdmin,
  getEmployeeDayDetail
);
router.get(
  "/employee-dashboard",
  auth,
  getEmployeeDashboard
);
router.get(
  "/employee-dashboard/day/:date",
  auth,
  getMyDayDetail
);
router.get(
  "/employee/:employeeId/detail",
  auth,
  isAdmin,
  getEmployeeDetailForAdmin
);


module.exports = router;
