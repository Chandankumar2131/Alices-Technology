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

module.exports = mongoose.model(
    "BreakLog",
    breakLogSchema
);