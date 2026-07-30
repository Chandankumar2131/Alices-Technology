const mongoose = require("mongoose");
const Lead = require("../model/Lead");
const SalesActivity = require("../model/SalesActivity");
const User = require("../model/User");
const { getShiftDate } = require("../utils/attendanceShift");

const isAdmin = (user) => ["Admin", "SuperAdmin"].includes(user.accountType);
const userFields = "firstName lastName email employeeId department designation image";
const populateLead = (query) => query.populate("createdBy", userFields).populate("assignedSales", userFields);

const accessFilter = (user) => {
  if (isAdmin(user)) return {};
  if (user.accountType !== "Employee") return null;
  if (user.department === "Lead Generation") return { createdBy: user.id };
  if (user.department === "Sales") return { assignedSales: user.id };
  return null;
};

exports.getSalesEmployees = async (req, res) => {
  try {
    if (!isAdmin(req.user) && !(req.user.accountType === "Employee" && req.user.department === "Lead Generation")) return res.status(403).json({ success: false, message: "Access denied" });
    const data = await User.find({ accountType: "Employee", department: "Sales", isActive: true }).select(userFields).sort({ firstName: 1, lastName: 1 });
    return res.json({ success: true, data });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.getLeadEmployees = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ success: false, message: "Admin access only" });
    const data = await User.find({ accountType: "Employee", department: "Lead Generation", isActive: true }).select(userFields).sort({ firstName: 1, lastName: 1 });
    return res.json({ success: true, data });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.getLeads = async (req, res) => {
  try {
    const filter = accessFilter(req.user);
    if (!filter) return res.status(403).json({ success: false, message: "This lead workspace is not available for your department" });
    const { date, status, leadPerson, salesPerson, search } = req.query;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ success: false, message: "Invalid filter date" });
      filter.workDate = date;
    }
    if (status && Lead.LEAD_STATUSES.includes(status)) filter.status = status;
    if (isAdmin(req.user) && leadPerson && mongoose.isValidObjectId(leadPerson)) filter.createdBy = leadPerson;
    if (isAdmin(req.user) && salesPerson && mongoose.isValidObjectId(salesPerson)) filter.assignedSales = salesPerson;
    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ candidateName: regex }, { email: regex }, { contactNumber: regex }];
    }
    const data = await populateLead(Lead.find(filter).sort({ generatedDate: -1, createdAt: -1 }));
    const summary = { total: data.length };
    Lead.LEAD_STATUSES.forEach((value) => { summary[value] = data.filter((lead) => lead.status === value).length; });
    return res.json({ success: true, count: data.length, summary, data });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.getSalesActivities = async (req, res) => {
  try {
    if (!isAdmin(req.user) && !(req.user.accountType === "Employee" && req.user.department === "Sales")) return res.status(403).json({ success: false, message: "Sales or admin access required" });
    const filter = {};
    if (!isAdmin(req.user)) filter.salesEmployee = req.user.id;
    if (req.query.date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) return res.status(400).json({ success: false, message: "Invalid filter date" });
      filter.workDate = req.query.date;
    }
    if (isAdmin(req.user) && req.query.salesPerson && mongoose.isValidObjectId(req.query.salesPerson)) filter.salesEmployee = req.query.salesPerson;
    if (req.query.status && Lead.LEAD_STATUSES.includes(req.query.status)) filter.status = req.query.status;
    const data = await SalesActivity.find(filter).populate("salesEmployee", userFields).populate({ path: "lead", populate: [{ path: "createdBy", select: userFields }, { path: "assignedSales", select: userFields }] }).sort({ createdAt: -1 });
    return res.json({ success: true, count: data.length, data });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.createLead = async (req, res) => {
  try {
    if (req.user.accountType !== "Employee" || req.user.department !== "Lead Generation") return res.status(403).json({ success: false, message: "Only Lead Generation employees can create leads" });
    const fields = ["candidateName", "contactNumber", "email", "linkedin", "graduationYear", "visaStatus", "leadComment", "callDate", "callTime"];
    const generatedDate = new Date();
    const payload = { createdBy: req.user.id, generatedDate, workDate: getShiftDate(generatedDate) };
    fields.forEach((field) => { if (req.body[field] !== undefined) payload[field] = req.body[field]; });
    if (!String(payload.candidateName || "").trim()) return res.status(400).json({ success: false, message: "Candidate name is required" });
    const lead = await Lead.create(payload);
    const data = await populateLead(Lead.findById(lead._id));
    return res.status(201).json({ success: true, message: "Lead created", data });
  } catch (error) { return res.status(error.name === "ValidationError" ? 400 : 500).json({ success: false, message: Object.values(error.errors || {})[0]?.message || error.message }); }
};

exports.forwardLead = async (req, res) => {
  try {
    const { salesEmployeeId } = req.body;
    if (!mongoose.isValidObjectId(req.params.leadId) || !mongoose.isValidObjectId(salesEmployeeId)) return res.status(400).json({ success: false, message: "Select a valid lead and Sales employee" });
    const filter = { _id: req.params.leadId };
    if (!isAdmin(req.user)) {
      if (req.user.department !== "Lead Generation") return res.status(403).json({ success: false, message: "Access denied" });
      filter.createdBy = req.user.id;
    }
    const [lead, salesEmployee] = await Promise.all([
      Lead.findOne(filter),
      User.findOne({ _id: salesEmployeeId, accountType: "Employee", department: "Sales", isActive: true }),
    ]);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    if (!salesEmployee) return res.status(400).json({ success: false, message: "Selected employee is not an active Sales employee" });
    lead.assignedSales = salesEmployee._id; lead.forwardedAt = new Date();
    if (lead.status === "New") lead.status = "Forwarded";
    await lead.save();
    const data = await populateLead(Lead.findById(lead._id));
    return res.json({ success: true, message: "Lead forwarded to Sales", data });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.updateSalesWork = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.leadId)) return res.status(400).json({ success: false, message: "Invalid lead" });
    const filter = { _id: req.params.leadId };
    if (!isAdmin(req.user)) {
      if (req.user.department !== "Sales") return res.status(403).json({ success: false, message: "Access denied" });
      filter.assignedSales = req.user.id;
    }
    const lead = await Lead.findOne(filter);
    if (!lead) return res.status(404).json({ success: false, message: "Assigned lead not found" });
    if (!lead.assignedSales) return res.status(400).json({ success: false, message: "Assign the lead to a Sales employee first" });
    ["salesComment", "callDate", "callTime"].forEach((field) => { if (req.body[field] !== undefined) lead[field] = req.body[field]; });
    if (req.body.status !== undefined) {
      if (!Lead.LEAD_STATUSES.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid lead status" });
      lead.status = req.body.status;
    }
    await lead.save();
    await SalesActivity.create({
      lead: lead._id,
      salesEmployee: lead.assignedSales,
      workDate: getShiftDate(),
      status: lead.status,
      salesComment: lead.salesComment,
      callDate: lead.callDate,
      callTime: lead.callTime,
    });
    const data = await populateLead(Lead.findById(lead._id));
    return res.json({ success: true, message: "Sales activity updated", data });
  } catch (error) { return res.status(error.name === "ValidationError" ? 400 : 500).json({ success: false, message: Object.values(error.errors || {})[0]?.message || error.message }); }
};
