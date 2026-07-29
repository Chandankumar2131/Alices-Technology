const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    appliedAt: { type: Date, default: Date.now, required: true },
    workDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    jobRole: { type: String, trim: true, default: "" },
    companyName: { type: String, trim: true, default: "" },
    jobPortal: {
      type: String,
      enum: ["LinkedIn", "Naukri", "Indeed", "Dice", "Monster", "ZipRecruiter", "Company Website", "Other"],
    },
    appliedUrl: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Applied", "Recruiter Response", "Interview Scheduled", "Rejected", "Selected", "Withdrawn"],
      default: "Applied",
    },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    batchId: { type: String, trim: true, default: "", index: true },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ candidate: 1, appliedAt: -1 });
jobApplicationSchema.index({ submittedBy: 1, appliedAt: -1 });
jobApplicationSchema.index({ workDate: 1, submittedBy: 1 });
jobApplicationSchema.index({ candidate: 1, workDate: 1, appliedUrl: 1 });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
