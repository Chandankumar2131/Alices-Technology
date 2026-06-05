const mongoose = require("mongoose");

const dailySubmissionSchema = new mongoose.Schema(
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

    formsSubmitted: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },

    targetForms: {
        type: Number,
        default: 100,
        min: 0,
    },

    remarks: {
        type: String,
        trim: true,
    },

    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
},
{
    timestamps: true,
}
);

// One submission per employee per day
dailySubmissionSchema.index(
    { employee: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "DailySubmission",
    dailySubmissionSchema
);