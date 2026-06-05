const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
{
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    salaryStructure: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalaryStructure",
        required: true,
    },

    month: {
        type: Number,
        required: true,
    },

    year: {
        type: Number,
        required: true,
    },

    workingDays: {
        type: Number,
        default: 0,
    },

    presentDays: {
        type: Number,
        default: 0,
    },

    leaveDays: {
        type: Number,
        default: 0,
    },

    absentDays: {
        type: Number,
        default: 0,
    },

    overtimeHours: {
        type: Number,
        default: 0,
    },

    grossSalary: {
        type: Number,
        default: 0,
    },

    deductions: {
        type: Number,
        default: 0,
    },

    netSalary: {
        type: Number,
        default: 0,
    },

    generatedAt: {
        type: Date,
        default: Date.now,
    },

    paymentStatus: {
        type: String,
        enum: [
            "Pending",
            "Paid"
        ],
        default: "Pending",
    },

    paidAt: {
        type: Date,
    },
},
{
    timestamps: true,
}
);

payrollSchema.index(
{
    employee: 1,
    month: 1,
    year: 1,
},
{
    unique: true,
}
);

module.exports = mongoose.model(
    "Payroll",
    payrollSchema
);