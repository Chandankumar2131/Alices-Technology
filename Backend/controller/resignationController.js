const mongoose = require("mongoose");
const User = require("../model/User");

const selectEmployee = "firstName lastName email employeeId department designation resignation image isActive employmentEndDate";
const notifyAdmins = (req) => req.app?.get("io")?.to("role:admin").emit("admin:notifications", { type: "resignation" });

exports.getResignations = async (req, res) => {
  try {
    const status = String(req.query.status || "").trim();
    const filter = {
      accountType: "Employee",
      "resignation.status": { $in: ["Submitted", "Approved", "Rejected", "Withdrawal Requested", "Withdrawn"] },
    };
    if (["Submitted", "Approved", "Rejected", "Withdrawal Requested", "Withdrawn"].includes(status)) filter["resignation.status"] = status;
    const data = await User.find(filter).select(selectEmployee)
      .populate("resignation.reviewedBy", "firstName lastName email")
      .populate("resignation.withdrawalReviewedBy", "firstName lastName email")
      .sort({ "resignation.resignationDate": -1 });
    return res.json({ success: true, count: data.length, data });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.reviewWithdrawal = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.employeeId)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID" });
    }
    const { decision, adminRemarks } = req.body;
    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({ success: false, message: "Select Approved or Rejected" });
    }

    const employee = await User.findOne({
      _id: req.params.employeeId,
      accountType: "Employee",
      isActive: true,
      "resignation.status": "Withdrawal Requested",
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Pending withdrawal request not found" });
    }

    employee.resignation.status = decision === "Approved" ? "Withdrawn" : "Approved";
    employee.resignation.withdrawalDecision = decision;
    employee.resignation.withdrawalAdminRemarks = String(adminRemarks || "").trim();
    employee.resignation.withdrawalReviewedBy = req.user.id;
    employee.resignation.withdrawalReviewedAt = new Date();
    if (decision === "Approved") employee.employmentEndDate = null;
    await employee.save();
    await employee.populate("resignation.withdrawalReviewedBy", "firstName lastName email");
    notifyAdmins(req);

    return res.json({
      success: true,
      message: `Withdrawal ${decision.toLowerCase()}`,
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewResignation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.employeeId)) return res.status(400).json({ success: false, message: "Invalid employee ID" });
    const { status, adminRemarks } = req.body;
    if (!["Approved", "Rejected"].includes(status)) return res.status(400).json({ success: false, message: "Select Approved or Rejected" });
    const employee = await User.findOne({ _id: req.params.employeeId, accountType: "Employee", "resignation.status": "Submitted" });
    if (!employee) return res.status(404).json({ success: false, message: "Pending resignation request not found" });
    employee.resignation.status = status;
    employee.resignation.adminRemarks = String(adminRemarks || "").trim();
    employee.resignation.reviewedBy = req.user.id;
    employee.resignation.reviewedAt = new Date();
    await employee.save();
    await employee.populate("resignation.reviewedBy", "firstName lastName email");
    notifyAdmins(req);
    return res.json({ success: true, message: `Resignation ${status.toLowerCase()}`, data: employee });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.updateHandover = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.employeeId)) return res.status(400).json({ success: false, message: "Invalid employee ID" });
    const { knowledgeTransferCompleted, assetsReturned } = req.body;
    if (knowledgeTransferCompleted === undefined && assetsReturned === undefined) return res.status(400).json({ success: false, message: "Select a handover item to update" });
    const employee = await User.findOne({ _id: req.params.employeeId, accountType: "Employee", "resignation.status": "Approved" });
    if (!employee) return res.status(404).json({ success: false, message: "Approved resignation request not found" });
    if (knowledgeTransferCompleted !== undefined) employee.resignation.knowledgeTransferCompleted = Boolean(knowledgeTransferCompleted);
    if (assetsReturned !== undefined) employee.resignation.assetsReturned = Boolean(assetsReturned);
    await employee.save();
    await employee.populate("resignation.reviewedBy", "firstName lastName email");
    return res.json({ success: true, message: "Handover status updated", data: employee });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
