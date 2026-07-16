const mongoose = require("mongoose");

const candidateAssignmentSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    previousRecruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

candidateAssignmentSchema.index({ recruiter: 1, assignedAt: -1 });

module.exports = mongoose.model("CandidateAssignment", candidateAssignmentSchema);
