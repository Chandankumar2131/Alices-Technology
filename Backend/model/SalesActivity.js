const mongoose = require("mongoose");

const salesActivitySchema = new mongoose.Schema({
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
  salesEmployee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  workDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
  status: { type: String, required: true },
  salesComment: { type: String, trim: true, maxlength: 2000, default: "" },
  callDate: { type: Date },
  callTime: { type: String, trim: true, default: "" },
}, { timestamps: true });

salesActivitySchema.index({ workDate: 1, salesEmployee: 1 });
module.exports = mongoose.model("SalesActivity", salesActivitySchema);
