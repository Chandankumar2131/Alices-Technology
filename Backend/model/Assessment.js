const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    receivedDate: { type: Date, required: true },
    companyName: { type: String, trim: true, maxlength: 200, default: "" },
    interviewerEmail: {
      type: String, required: true, trim: true, lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid interviewer email"],
    },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { timestamps: true }
);

assessmentSchema.index({ recruiter: 1, receivedDate: -1 });
assessmentSchema.index({ candidate: 1, receivedDate: -1 });

module.exports = mongoose.model("Assessment", assessmentSchema);
