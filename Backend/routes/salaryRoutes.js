const express = require("express");

const router = express.Router();

// Controllers
const {
  createSalaryStructure,
  updateSalaryStructure,
  getSalaryStructure,
  getMySalary,
} = require("../controller/salaryController");

// Middleware
const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// ==========================================
// ADMIN ROUTES
// ==========================================

// Create Salary Structure
router.post(
  "/create",
  auth,
  isAdmin,
  createSalaryStructure
);

// Update Salary Structure
router.put(
  "/update/:employeeId",
  auth,
  isAdmin,
  updateSalaryStructure
);

// ==========================================
// EMPLOYEE ROUTES
// ==========================================

// Get My Salary Structure
router.get(
  "/my-salary",
  auth,
  getMySalary
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get Employee Salary Structure
router.get(
  "/:employeeId",
  auth,
  isAdmin,
  getSalaryStructure
);

module.exports = router;