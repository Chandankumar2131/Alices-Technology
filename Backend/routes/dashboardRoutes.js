const express = require("express");

const router = express.Router();

const {
  getAdminDashboard,
  getLiveEmployees,
  getEmployeeDashboard,
  getDepartmentAnalytics,
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

module.exports = router;