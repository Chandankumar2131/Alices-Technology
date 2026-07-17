const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const EmployeeDocument = require("../model/EmployeeDocument");
const User = require("../model/User");

const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_SIZE = 8 * 1024 * 1024;
const isAdmin = (user) => ["Admin", "SuperAdmin"].includes(user.accountType);
const sanitizeName = (name) => String(name || "document").replace(/[^\w.\- ()]/g, "").trim().slice(0, 150) || "document";
const maskNumber = (value) => {
  const text = String(value || "").replace(/\s+/g, "");
  if (!text) return "";
  return text.length <= 4 ? "*".repeat(text.length) : `${"*".repeat(Math.min(text.length - 4, 8))}${text.slice(-4)}`;
};
const serialize = (document) => {
  const item = document.toObject ? document.toObject() : document;
  return {
    _id: item._id, employee: item.employee, documentType: item.documentType,
    maskedDocumentNumber: maskNumber(item.documentNumber), fileName: item.file?.fileName,
    mimeType: item.file?.mimeType, size: item.file?.size, status: item.status,
    adminRemarks: item.adminRemarks, reviewedBy: item.reviewedBy, reviewedAt: item.reviewedAt,
    createdAt: item.createdAt, updatedAt: item.updatedAt,
  };
};

const uploadFile = async ({ dataUrl, fileName, mimeType, size, employeeId }) => {
  const fileSize = Number(size || 0);
  if (!ALLOWED_TYPES.has(mimeType) || !fileSize || fileSize > MAX_SIZE || typeof dataUrl !== "string" || !dataUrl.startsWith(`data:${mimeType};base64,`)) {
    const error = new Error("Upload a PDF, JPG or PNG document up to 8 MB"); error.status = 400; throw error;
  }
  const safeName = sanitizeName(fileName);
  const extension = safeName.includes(".") ? safeName.split(".").pop().toLowerCase() : mimeType === "application/pdf" ? "pdf" : "jpg";
  const result = await cloudinary.uploader.upload(dataUrl, {
    public_id: `employee-documents/${employeeId}/${Date.now()}-${safeName.replace(/\.[^.]+$/, "")}.${extension}`,
    resource_type: "raw", type: "authenticated", unique_filename: true,
  });
  return { publicId: result.public_id, fileName: safeName, mimeType, size: fileSize };
};

exports.getMyDocuments = async (req, res) => {
  if (req.user.accountType !== "Employee") return res.status(403).json({ success: false, message: "Employee access only" });
  const documents = await EmployeeDocument.find({ employee: req.user.id }).populate("reviewedBy", "firstName lastName").sort({ updatedAt: -1 });
  return res.json({ success: true, data: documents.map(serialize) });
};

exports.uploadDocument = async (req, res) => {
  try {
    if (req.user.accountType !== "Employee") return res.status(403).json({ success: false, message: "Employee access only" });
    const { documentId, documentType, documentNumber, dataUrl, fileName, mimeType, size } = req.body;
    if (!documentType) return res.status(400).json({ success: false, message: "Document type is required" });
    let document = null;
    if (documentId) document = await EmployeeDocument.findOne({ _id: documentId, employee: req.user.id });
    if (documentId && !document) return res.status(404).json({ success: false, message: "Document not found" });
    if (document?.status === "Verified") return res.status(400).json({ success: false, message: "Verified documents cannot be replaced without an admin request" });
    const file = await uploadFile({ dataUrl, fileName, mimeType, size, employeeId: req.user.id });
    const oldPublicId = document?.file?.publicId;
    if (document) {
      document.documentType = documentType;
      if (documentNumber !== undefined) document.documentNumber = documentNumber;
      document.file = file;
      document.status = "Pending Review"; document.adminRemarks = ""; document.reviewedBy = null; document.reviewedAt = null;
      await document.save();
    } else {
      document = await EmployeeDocument.create({ employee: req.user.id, documentType, documentNumber, file });
    }
    if (oldPublicId) cloudinary.uploader.destroy(oldPublicId, { resource_type: "raw", type: "authenticated" }).catch(() => {});
    return res.status(documentId ? 200 : 201).json({ success: true, message: documentId ? "Document replaced" : "Document uploaded", data: serialize(document) });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message || "Document upload failed" });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await EmployeeDocument.findOne({ _id: req.params.id, employee: req.user.id });
    if (!document) return res.status(404).json({ success: false, message: "Document not found" });
    if (document.status === "Verified") return res.status(400).json({ success: false, message: "Verified documents cannot be deleted" });
    await document.deleteOne();
    await cloudinary.uploader.destroy(document.file.publicId, { resource_type: "raw", type: "authenticated" }).catch(() => {});
    return res.json({ success: true, message: "Document deleted" });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.getEmployeeDocuments = async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.employeeId, accountType: "Employee" }).select("_id");
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });
    const documents = await EmployeeDocument.find({ employee: employee._id }).populate("reviewedBy", "firstName lastName").sort({ updatedAt: -1 });
    return res.json({ success: true, data: documents.map(serialize) });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.reviewDocument = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    if (!["Verified", "Rejected", "Replacement Requested"].includes(status)) return res.status(400).json({ success: false, message: "Select a valid review status" });
    const document = await EmployeeDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, message: "Document not found" });
    document.status = status; document.adminRemarks = adminRemarks || ""; document.reviewedBy = req.user.id; document.reviewedAt = new Date();
    await document.save(); await document.populate("reviewedBy", "firstName lastName");
    return res.json({ success: true, message: "Document review updated", data: serialize(document) });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.accessDocument = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid document" });
    const document = await EmployeeDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, message: "Document not found" });
    if (!isAdmin(req.user) && String(document.employee) !== String(req.user.id)) return res.status(403).json({ success: false, message: "Access denied" });
    const url = cloudinary.url(document.file.publicId, { resource_type: "raw", type: "authenticated", sign_url: true, secure: true });
    return res.redirect(url);
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
