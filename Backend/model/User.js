const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      unique: true, 
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

   accountType: {
  type: String,
  enum: [
    "SuperAdmin",
    "Admin",
    "Employee",
    "Candidate",
  ],
  required: true,
},

    additionalDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    profileImagePublicId: {
      type: String,
      default: null,
      select: false,
    },

    token: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sessionVersion: {
      type: Number,
      default: 0,
      select: false,
    },

    department: {
      type: String,
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
    },

    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    employmentEndDate: {
      type: Date,
      default: null,
    },

    offboardingHistory: [
      {
        action: {
          type: String,
          enum: ["Offboarded", "Reactivated"],
          required: true,
        },
        effectiveDate: { type: Date },
        reason: { type: String, trim: true, maxlength: 500 },
        remarks: { type: String, trim: true, maxlength: 2000 },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        actorType: {
          type: String,
          enum: ["Admin", "System"],
          default: "Admin",
        },
        performedAt: { type: Date, default: Date.now },
      },
    ],

    lastLogin: {
      type: Date,
    },

    lastLogout: {
      type: Date,
    },

    resignation: {
      status: {
        type: String,
        enum: ["None", "Submitted", "Approved", "Rejected", "Withdrawal Requested", "Withdrawn"],
        default: "None",
      },
      resignationDate: {
        type: Date,
      },
      lastWorkingDay: {
        type: Date,
      },
      reason: {
        type: String,
        trim: true,
      },
      knowledgeTransferCompleted: {
        type: Boolean,
        default: false,
      },
      assetsReturned: {
        type: Boolean,
        default: false,
      },
      adminRemarks: { type: String, trim: true, maxlength: 2000, default: "" },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
      withdrawalReason: { type: String, trim: true, maxlength: 2000, default: "" },
      withdrawalRequestedAt: { type: Date },
      withdrawalReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      withdrawalReviewedAt: { type: Date },
      withdrawalAdminRemarks: { type: String, trim: true, maxlength: 2000, default: "" },
      withdrawalDecision: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.password;
        delete ret.token;
        delete ret.resetPasswordExpires;
        delete ret.sessionVersion;
        return ret;
      },
    },
    toObject: {
      transform: function (_doc, ret) {
        delete ret.password;
        delete ret.token;
        delete ret.resetPasswordExpires;
        delete ret.sessionVersion;
        return ret;
      },
    },
  }
);

userSchema.index({ accountType: 1, isActive: 1, createdAt: -1 });
userSchema.index({ department: 1 });

module.exports = mongoose.model("User", userSchema);
