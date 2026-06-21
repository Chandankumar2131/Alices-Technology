const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
{
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    leaveType: {
        type: String,
        enum: [
            "Casual Leave",
            "Sick Leave",
            "Emergency Leave",
            "Paid Leave",
            "Unpaid Leave"
        ],
        required: true,
    },

    startDate: {
        type: Date,
        required: true,
    },

    endDate: {
        type: Date,
        required: true,
    },

    totalDays: {
        type: Number,
        default: 1,
    },

    reason: {
        type: String,
        required: true,
        trim: true,
    },

    status: {
        type: String,
        enum: [
            "Pending",
            "Approved",
            "Rejected"
        ],
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
    },
},
{
    timestamps: true,
}
);

leaveSchema.index({ employee: 1, createdAt: -1 });
leaveSchema.index({ status: 1, createdAt: -1 });
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1, status: 1 });

module.exports = mongoose.model(
    "Leave",
    leaveSchema
);
