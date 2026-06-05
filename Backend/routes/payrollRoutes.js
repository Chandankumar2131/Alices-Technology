const express = require("express");

const router = express.Router();

// Controllers
const {
  generatePayroll,
  getMyPayroll,
  getEmployeePayroll,
  getAllPayrolls,
  markPayrollPaid,
} = require("../controller/payrollController");

// Middleware
const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// ==========================================
// EMPLOYEE ROUTES
// ==========================================

// Get My Payroll History
router.get(
  "/my-payroll",
  auth,
  getMyPayroll
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Generate Payroll
router.post(
  "/generate",
  auth,
  isAdmin,
  generatePayroll
);

// Get All Payrolls
router.get(
  "/all",
  auth,
  isAdmin,
  getAllPayrolls
);

// Get Employee Payroll
router.get(
  "/employee/:employeeId",
  auth,
  isAdmin,
  getEmployeePayroll
);

// Mark Payroll As Paid
router.patch(
  "/pay/:payrollId",
  auth,
  isAdmin,
  markPayrollPaid
);

module.exports = router;