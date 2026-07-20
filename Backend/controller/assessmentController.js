const mongoose = require("mongoose");
const Assessment = require("../model/Assessment");
const Candidate = require("../model/Candidate");

const isAdmin = (user) => ["Admin", "SuperAdmin"].includes(user.accountType);
const populateRecord = (query) => query
  .populate("recruiter", "firstName lastName email employeeId department designation")
  .populate({ path: "candidate", populate: { path: "user", select: "firstName lastName email" } });

const resolveCandidate = (candidateId, user) => {
  if (!mongoose.isValidObjectId(candidateId)) return null;
  const filter = { _id: candidateId };
  if (user.accountType === "Employee") filter.assignedRecruiter = user.id;
  return Candidate.findOne(filter).select("_id");
};

exports.createAssessment = async (req, res) => {
  try {
    if (!["Employee", "Admin", "SuperAdmin"].includes(req.user.accountType)) return res.status(403).json({ success: false, message: "Access denied" });
    const { candidateId, receivedDate, companyName, interviewerEmail, notes } = req.body;
    if (!candidateId || !receivedDate || !companyName?.trim() || !interviewerEmail) return res.status(400).json({ success: false, message: "Candidate, received date, company name and interviewer email are required" });
    const candidate = await resolveCandidate(candidateId, req.user);
    if (!candidate) return res.status(403).json({ success: false, message: "Select a candidate assigned to you" });
    const parsedDate = new Date(receivedDate);
    if (Number.isNaN(parsedDate.getTime())) return res.status(400).json({ success: false, message: "Please provide a valid received date" });
    const assessment = await Assessment.create({ recruiter: req.user.id, candidate: candidate._id, receivedDate: parsedDate, companyName, interviewerEmail, notes });
    const data = await populateRecord(Assessment.findById(assessment._id));
    return res.status(201).json({ success: true, message: "Assessment record added", data });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAssessments = async (req, res) => {
  try {
    const filter = isAdmin(req.user) ? {} : { recruiter: req.user.id };
    const data = await populateRecord(Assessment.find(filter).sort({ receivedDate: -1, createdAt: -1 }));
    return res.json({ success: true, count: data.length, data });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.updateAssessment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.assessmentId)) return res.status(400).json({ success: false, message: "Invalid assessment ID" });
    const filter = { _id: req.params.assessmentId };
    if (!isAdmin(req.user)) filter.recruiter = req.user.id;
    const assessment = await Assessment.findOne(filter);
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment record not found" });
    if (req.body.candidateId !== undefined) {
      const candidate = await resolveCandidate(req.body.candidateId, req.user);
      if (!candidate) return res.status(403).json({ success: false, message: "Candidate is not available to you" });
      assessment.candidate = candidate._id;
    }
    ["receivedDate", "companyName", "interviewerEmail", "notes"].forEach((field) => {
      if (req.body[field] !== undefined) assessment[field] = req.body[field];
    });
    await assessment.save();
    const data = await populateRecord(Assessment.findById(assessment._id));
    return res.json({ success: true, message: "Assessment record updated", data });
  } catch (error) {
    if (["ValidationError", "CastError"].includes(error.name)) return res.status(400).json({ success: false, message: Object.values(error.errors || {})[0]?.message || "Invalid assessment details" });
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyCandidateAssessments = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ user: req.user.id }).select("_id");
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate profile not found" });
    const data = await Assessment.find({ candidate: candidate._id }).populate("recruiter", "firstName lastName email designation").sort({ receivedDate: -1 });
    return res.json({ success: true, count: data.length, data });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
