const mongoose = require("mongoose");

const attendanceCorrectionSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
    },
    currentCheckIn: {
      type: Date,
      required: true,
    },
    requestedCheckIn: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    adminRemarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

attendanceCorrectionSchema.index(
  { employee: 1, attendance: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "Pending" },
  }
);

module.exports = mongoose.model(
  "AttendanceCorrection",
  attendanceCorrectionSchema
);
