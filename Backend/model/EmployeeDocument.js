const mongoose = require("mongoose");

const DOCUMENT_TYPES = [
  "Aadhaar Card", "PAN Card", "Passport", "Driving Licence", "Educational Certificate",
  "Experience Letter", "Offer / Appointment Letter", "Relieving Letter", "Address Proof", "Other",
];
const DOCUMENT_STATUSES = ["Pending Review", "Verified", "Rejected", "Replacement Requested"];

const employeeDocumentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  documentType: { type: String, enum: DOCUMENT_TYPES, required: true },
  documentNumber: { type: String, trim: true, maxlength: 80, default: "" },
  file: {
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  status: { type: String, enum: DOCUMENT_STATUSES, default: "Pending Review", index: true },
  adminRemarks: { type: String, trim: true, maxlength: 1000, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

employeeDocumentSchema.index({ employee: 1, documentType: 1, createdAt: -1 });

module.exports = mongoose.model("EmployeeDocument", employeeDocumentSchema);
module.exports.DOCUMENT_TYPES = DOCUMENT_TYPES;
module.exports.DOCUMENT_STATUSES = DOCUMENT_STATUSES;
