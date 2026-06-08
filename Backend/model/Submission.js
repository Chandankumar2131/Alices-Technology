const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    // Recruiter (Logged-in Employee)
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Candidate Details
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },

    candidateEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    candidatePhone: {
      type: String,
      required: true,
      trim: true,
    },

    // Job Details
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },

    portal: {
      type: String,
      enum: [
        "LinkedIn",
        "Dice",
        "Indeed",
        "Monster",
        "Naukri",
        "Company Website",
        "Other",
      ],
      default: "Other",
    },

    // Submission Status
    status: {
      type: String,
      enum: [
        "Submitted",
        "Interview Scheduled",
        "Interview Completed",
        "Selected",
        "Rejected",
        "Offer Released",
        "Joined",
      ],
      default: "Submitted",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Submission",
  submissionSchema
);