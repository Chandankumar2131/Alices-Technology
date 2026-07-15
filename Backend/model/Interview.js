const mongoose = require("mongoose");

const INTERVIEW_ROUNDS = [
  "Screening",
  "First Round",
  "Second Round",
  "Third Round",
  "Final Round",
];

const INTERVIEW_STATUSES = [
  "Scheduled",
  "Completed",
  "Rescheduled",
  "Selected",
  "Rejected",
  "Cancelled",
];

const interviewSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    candidateName: { type: String, required: true, trim: true },
    emailReceivedDate: { type: Date, required: true },
    jobTitle: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    interviewEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid interview email"],
    },
    scheduledAt: { type: Date, required: true },
    interviewRound: {
      type: String,
      enum: INTERVIEW_ROUNDS,
      default: "Screening",
    },
    status: {
      type: String,
      enum: INTERVIEW_STATUSES,
      default: "Scheduled",
    },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { timestamps: true }
);

interviewSchema.index({ recruiter: 1, scheduledAt: -1 });
interviewSchema.index({ status: 1, scheduledAt: 1 });
interviewSchema.index({ companyName: 1, candidateName: 1 });

module.exports = mongoose.model("Interview", interviewSchema);
module.exports.INTERVIEW_ROUNDS = INTERVIEW_ROUNDS;
module.exports.INTERVIEW_STATUSES = INTERVIEW_STATUSES;
