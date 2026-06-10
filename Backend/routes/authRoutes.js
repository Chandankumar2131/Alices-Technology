const express = require("express");

const router = express.Router();

// Controllers
const {
  login,
  createEmployee, 
  getAllEmployees,
  deactivateEmployee,
  createAdmin,
  getProfile,
  updateProfile,
  updateProfileDetails,
  changePassword,
} = require("../controller/authController");

// Middleware
const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const isSuperAdmin = require("../middleware/isSuperAdmin");
// ==========================================
// PUBLIC ROUTES
// ==========================================
// Employee/Admin Login
router.post("/login", login);
// ==========================================
// ADMIN ROUTES
// ==========================================
// Create Employee
router.post("/create-employee", auth, isAdmin, createEmployee);

// Get All Employees
router.get("/employees",auth,isAdmin,getAllEmployees);

// Deactivate Employee
router.patch("/deactivate/:id",auth,isAdmin,deactivateEmployee);
  
// Create Admin
router.post("/create-admin", auth, isSuperAdmin, createAdmin);

// ==========================================
// PROFILE ROUTES
// ==========================================
router.get("/profile", auth, getProfile);
router.put("/profile/update", auth, updateProfile);
router.put("/profile/details", auth, updateProfileDetails);
router.post("/change-password", auth, changePassword);

module.exports = router;