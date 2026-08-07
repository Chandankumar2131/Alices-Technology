const express = require("express");

const router = express.Router();

// Controllers
const {
  login,
  logout,
  createEmployee, 
  getAllEmployees,
  deactivateEmployee,
  reactivateEmployee,
  createAdmin,
  getProfile,
  updateProfile,
  updateProfileDetails,
  updateProfilePicture,
  changePassword,
  resetEmployeePassword,
  submitResignation,
  withdrawResignation,
  updateUserEmail,
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
router.post("/logout", logout);
// ==========================================
// ADMIN ROUTES
// ==========================================
// Create Employee
router.post("/create-employee", auth, isAdmin, createEmployee);
router.patch("/users/:id/email", auth, isAdmin, updateUserEmail);

// Get All Employees
router.get("/employees",auth,isAdmin,getAllEmployees);

// Deactivate Employee
router.patch("/deactivate/:id",auth,isAdmin,deactivateEmployee);
router.patch("/reactivate/:id", auth, isAdmin, reactivateEmployee);

// Reset Employee Password
router.post("/reset-employee-password/:id", auth, isSuperAdmin, resetEmployeePassword);
  
// Create Admin
router.post("/create-admin", auth, isSuperAdmin, createAdmin);

// ==========================================
// PROFILE ROUTES
// ==========================================
router.get("/profile", auth, getProfile);
router.put("/profile/update", auth, updateProfile);
router.put("/profile/details", auth, updateProfileDetails);
router.put("/profile/picture", auth, updateProfilePicture);
router.post("/change-password", auth, changePassword);
router.post("/resignation", auth, submitResignation);
router.post("/resignation/withdraw", auth, withdrawResignation);

module.exports = router;
