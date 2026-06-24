const mongoose = require("mongoose");

const breakLogSchema = new mongoose.Schema(
{
    attendance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attendance",
        required: true,
    },

    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    breakStart: {
        type: Date,
        required: true,
    },

    breakEnd: {
        type: Date,
    },

    duration: {
        type: Number, // minutes
        default: 0,
    },

    reason: {
        type: String,
        enum: [
            "Lunch",
            "Tea",
            "Personal",
            "Meeting",
            "Other"
        ],
        default: "Other",
    },

    status: {
        type: String,
        enum: ["Active", "Completed"],
        default: "Active",
    },
},
{
    timestamps: true,
}
);

breakLogSchema.index({ employee: 1, status: 1 });
breakLogSchema.index(
    { employee: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "Active" },
    }
);
breakLogSchema.index({ attendance: 1, breakStart: -1 });
breakLogSchema.index({ status: 1, breakStart: -1 });

module.exports = mongoose.model(
    "BreakLog",
    breakLogSchema
);
