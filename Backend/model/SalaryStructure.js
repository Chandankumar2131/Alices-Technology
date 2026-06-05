const mongoose = require("mongoose");

const salaryStructureSchema =
  new mongoose.Schema(
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
      },

      basicSalary: {
        type: Number,
        required: true,
        default: 0,
      },

      hra: {
        type: Number,
        default: 0,
      },

      specialAllowance: {
        type: Number,
        default: 0,
      },

      bonus: {
        type: Number,
        default: 0,
      },

      pf: {
        type: Number,
        default: 0,
      },

      professionalTax: {
        type: Number,
        default: 0,
      },

      otherDeductions: {
        type: Number,
        default: 0,
      },

      grossSalary: {
        type: Number,
        default: 0,
      },

      netSalary: {
        type: Number,
        default: 0,
      },

      effectiveFrom: {
        type: Date,
        default: Date.now,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "SalaryStructure",
  salaryStructureSchema
);