const mongoose = require("mongoose");

const aiAuditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accountType: { type: String, required: true },
    action: {
      type: String,
      enum: ["assistant", "candidate_summary"],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    model: { type: String, required: true },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    promptCharacters: { type: Number, default: 0 },
    responseCharacters: { type: Number, default: 0 },
    requestId: { type: String, default: "" },
    errorCode: { type: String, default: "" },
  },
  { timestamps: true }
);

aiAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AiAuditLog", aiAuditLogSchema);
