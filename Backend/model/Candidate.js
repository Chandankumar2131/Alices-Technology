const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    candidateId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    phone: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    primaryJobRole: { type: String, required: true, trim: true },
    experience: { type: String, trim: true, default: "" },
    skills: [{ type: String, trim: true }],
    subscriptionStartDate: { type: Date, required: true },
    subscriptionEndDate: { type: Date, required: true },
    subscriptionStatus: {
      type: String,
      enum: ["Trial", "Active", "Expiring Soon", "Expired", "Paused", "Cancelled"],
      default: "Active",
    },
    resumeStatus: {
      type: String,
      enum: ["Details Pending", "Resume In Progress", "Ready", "Revision Requested", "Approved"],
      default: "Details Pending",
    },
    resumeUrl: { type: String, trim: true, default: "" },
    resumeFile: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
      fileName: { type: String, default: "" },
      size: { type: Number, default: 0 },
      uploadedAt: { type: Date, default: null },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    assignedRecruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    assignedAt: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 3000, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

candidateSchema.index({ subscriptionStatus: 1, subscriptionEndDate: 1 });
candidateSchema.index({ primaryJobRole: 1, createdAt: -1 });

module.exports = mongoose.model("Candidate", candidateSchema);
