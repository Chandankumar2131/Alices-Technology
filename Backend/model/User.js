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

    lastLogin: {
      type: Date,
    },

    lastLogout: {
      type: Date,
    },

    resignation: {
      status: {
        type: String,
        enum: ["None", "Submitted"],
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
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.password;
        delete ret.token;
        delete ret.resetPasswordExpires;
        return ret;
      },
    },
    toObject: {
      transform: function (_doc, ret) {
        delete ret.password;
        delete ret.token;
        delete ret.resetPasswordExpires;
        return ret;
      },
    },
  }
);

userSchema.index({ accountType: 1, isActive: 1, createdAt: -1 });
userSchema.index({ department: 1 });

module.exports = mongoose.model("User", userSchema);
