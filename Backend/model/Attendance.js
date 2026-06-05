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
      required: true,
      default: Date.now,
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

    checkIn: {
      type: Date,
    },

    checkOut: {
      type: Date,
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
    attendanceDate: {
  type: String,
  required: true,
},

    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One Attendance Per Employee Per Day
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