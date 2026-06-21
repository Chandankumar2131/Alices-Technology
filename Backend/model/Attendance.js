const mongoose = require("mongoose");

const ATTENDANCE_STATUSES = [
  "Present",
  "Absent",
  "Leave",
  "Half Day",
  "Weekend",
  "Holiday",
];

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

    attendanceDate: {
      type: String,
      required: true,
    },

    dayName: {
      type: String,
      trim: true,
    },

    isWeekend: {
      type: Boolean,
      default: false,
    },

    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    breakLogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BreakLog",
      },
    ],

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

    lateArrival: {
      type: Boolean,
      default: false,
    },

    earlyLogout: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
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
      enum: ATTENDANCE_STATUSES,
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

attendanceSchema.index(
  {
    employee: 1,
    attendanceDate: 1,
  },
  {
    unique: true,
  }
);
attendanceSchema.index({ employee: 1, date: -1 });
attendanceSchema.index({ attendanceDate: 1, status: 1 });
attendanceSchema.index({ attendanceDate: 1, lateArrival: 1 });
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
