const express = require("express");
const { auth } = require("../middleware/auth");
const User = require("../model/User");
const { getLeads, getSalesActivities, createLead, forwardLead, updateSalesWork, getSalesEmployees, getLeadEmployees } = require("../controller/leadController");

const router = express.Router();
router.use(auth);
router.use(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("accountType department isActive");
    if (!user || !user.isActive) return res.status(403).json({ success: false, message: "Active user account required" });
    req.user.accountType = user.accountType;
    req.user.department = user.department;
    return next();
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
});
router.get("/sales-employees", getSalesEmployees);
router.get("/lead-employees", getLeadEmployees);
router.get("/sales-activities", getSalesActivities);
router.get("/", getLeads);
router.post("/", createLead);
router.patch("/:leadId/forward", forwardLead);
router.patch("/:leadId/sales", updateSalesWork);
module.exports = router;
