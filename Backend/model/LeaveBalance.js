const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    casualAvailable: {
      type: Number,
      default: 0,
    },
    sickAvailable: {
      type: Number,
      default: 0,
    },
    carryForwardAvailable: {
      type: Number,
      default: 0,
    },
    carryForwardExpiresAt: {
      type: Date,
    },
    unpaidLeaveDays: {
      type: Number,
      default: 0,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    lastSickAccrualKey: {
      type: String,
    },
    lastCasualAccrualYear: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

leaveBalanceSchema.index({ employee: 1 });

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);
