const mongoose = require("mongoose");

const LEAD_STATUSES = [
  "Follow-UP",
  "Closed",
  "Not Interested",
  "Call Not pickup",
  "Reschedule",
  "Meeting Scheduled",
  "call scheduled",
];
const LEGACY_STATUSES = ["New", "Forwarded", "Contacted", "Follow Up", "Converted", "Rejected"];
const STORED_LEAD_STATUSES = [...new Set([...LEGACY_STATUSES, ...LEAD_STATUSES])];

const leadSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  assignedSales: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  leadComment: { type: String, trim: true, maxlength: 2000, default: "" },
  salesComment: { type: String, trim: true, maxlength: 2000, default: "" },
  status: { type: String, enum: STORED_LEAD_STATUSES, default: "New", index: true },
  generatedDate: { type: Date, default: Date.now, required: true, index: true },
  workDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
  forwardedAt: { type: Date },
  callDate: { type: Date },
  callTime: { type: String, trim: true, default: "" },
  candidateName: { type: String, required: true, trim: true, maxlength: 200 },
  contactNumber: { type: String, trim: true, maxlength: 50, default: "" },
  email: { type: String, trim: true, lowercase: true, maxlength: 200, default: "" },
  linkedin: { type: String, trim: true, maxlength: 1000, default: "" },
  graduationYear: { type: String, trim: true, maxlength: 10, default: "" },
  visaStatus: { type: String, trim: true, maxlength: 100, default: "" },
}, { timestamps: true });

leadSchema.index({ createdBy: 1, generatedDate: -1 });
leadSchema.index({ workDate: 1, createdBy: 1 });
leadSchema.index({ assignedSales: 1, status: 1, generatedDate: -1 });

module.exports = mongoose.model("Lead", leadSchema);
module.exports.LEAD_STATUSES = LEAD_STATUSES;
