const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    // Date in YYYY-MM-DD format
    attendanceDate: {
      type: String,
      required: true,
    },

    // Day Information
    dayName: {
      type: String,
      trim: true,
    },

    isWeekend: {
      type: Boolean,
      default: false,
    },

    // Check In / Check Out
    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    // Break Logs
    breakLogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BreakLog",
      },
    ],

    // Working Hours
    totalHours: {
      type: Number,
      default: 0,
    },

    breakHours: {
      type: Number,
      default: 0,
    },

    productiveHours: {
      type: Number,
      default: 0,
    },

    overtimeHours: {
      type: Number,
      default: 0,
    },

    // Flags
    lateArrival: {
      type: Boolean,
      default: false,
    },

    earlyLogout: {
      type: Boolean,
      default: false,
    },

    // Attendance Status
    status: {
      type: String,
      enum: [
        "Present",
        "Absent",
        "Leave",
        "Half Day",
        "Weekend",
      ],
      default: "Present",
    },

    attendanceSource: {
      type: String,
      enum: ["Web", "Mobile", "System"],
      default: "Web",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    statusOverride: {
      type: Boolean,
      default: false,
    },

    systemStatus: {
      type: String,
      enum: [
        "Present",
        "Absent",
        "Leave",
        "Half Day",
        "Weekend",
      ],
    },

    overrideBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    overrideAt: {
      type: Date,
    },

    overrideReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance for same employee on same day
attendanceSchema.index(
  {
    employee: 1,
    attendanceDate: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "Attendance",
  attendanceSchema
);
