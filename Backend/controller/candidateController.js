const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Candidate = require("../model/Candidate");
const CandidateAssignment = require("../model/CandidateAssignment");
const JobApplication = require("../model/JobApplication");
const Profile = require("../model/Profile");
const User = require("../model/User");
const Interview = require("../model/Interview");
const cloudinary = require("../config/cloudinary");
const { getPagination, paginatedResponse } = require("../utils/pagination");
const { getShiftDate } = require("../utils/attendanceShift");

const isAdmin = (user) => ["Admin", "SuperAdmin"].includes(user.accountType);
const candidatePopulate = [
  { path: "user", select: "firstName lastName email image isActive" },
  { path: "assignedRecruiter", select: "firstName lastName email image employeeId department designation isActive" },
];

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) return skills.map((item) => String(item).trim()).filter(Boolean);
  return String(skills || "").split(",").map((item) => item.trim()).filter(Boolean);
};

const validDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && startDate <= endDate;
};

const validUrl = (value) => {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const backfillApplicationWorkDates = async () => {
  const records = await JobApplication.find({ $or: [{ workDate: { $exists: false } }, { workDate: null }, { workDate: "" }] }).select("_id appliedAt").lean();
  if (!records.length) return;
  await JobApplication.bulkWrite(records.map((record) => ({
    updateOne: { filter: { _id: record._id }, update: { $set: { workDate: getShiftDate(record.appliedAt) } } },
  })), { ordered: false });
};

exports.createCandidate = async (req, res) => {
  let profile;
  let user;
  try {
    const {
      firstName, lastName, email, password, candidateId, phone, location,
      primaryJobRole, experience, skills, subscriptionStartDate, subscriptionEndDate,
      subscriptionStatus, resumeStatus, resumeUrl, notes,
    } = req.body;

    if (![firstName, lastName, email, password, primaryJobRole, subscriptionStartDate, subscriptionEndDate].every(Boolean)) {
      return res.status(400).json({ success: false, message: "Please fill all required candidate and login fields" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (!validDateRange(subscriptionStartDate, subscriptionEndDate)) {
      return res.status(400).json({ success: false, message: "Subscription dates are invalid" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    let normalizedCandidateId = candidateId ? String(candidateId).trim().toUpperCase() : "";
    if (!normalizedCandidateId) {
      do {
        normalizedCandidateId = `CND-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(100, 1000)}`;
      } while (await Candidate.exists({ candidateId: normalizedCandidateId }));
    }
    const [existingUser, existingCandidate] = await Promise.all([
      User.findOne({ $or: [{ email: normalizedEmail }, { employeeId: normalizedCandidateId }] }),
      Candidate.findOne({ candidateId: normalizedCandidateId }),
    ]);
    if (existingUser) return res.status(409).json({ success: false, message: "A login with this email already exists" });
    if (existingCandidate) return res.status(409).json({ success: false, message: "Candidate ID already exists" });

    profile = await Profile.create({ contactNumber: phone || undefined });
    user = await User.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      accountType: "Candidate",
      employeeId: normalizedCandidateId,
      department: "Candidate Services",
      designation: "Candidate",
      additionalDetails: profile._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(`${firstName} ${lastName}`)}`,
    });

    const candidate = await Candidate.create({
      user: user._id,
      candidateId: normalizedCandidateId,
      phone,
      location,
      primaryJobRole,
      experience,
      skills: normalizeSkills(skills),
      subscriptionStartDate,
      subscriptionEndDate,
      subscriptionStatus,
      resumeStatus,
      resumeUrl,
      notes,
      createdBy: req.user.id,
    });
    await candidate.populate(candidatePopulate);
    return res.status(201).json({ success: true, message: "Candidate and login created successfully", data: candidate });
  } catch (error) {
    if (user?._id) await User.findByIdAndDelete(user._id).catch(() => {});
    if (profile?._id) await Profile.findByIdAndDelete(profile._id).catch(() => {});
    if (error.name === "ValidationError") return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message });
    return res.status(500).json({ success: false, message: "Failed to create candidate", error: error.message });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.user.accountType === "Employee") filter.assignedRecruiter = req.user.id;
    else if (!isAdmin(req.user)) return res.status(403).json({ success: false, message: "Access denied" });

    const { status, recruiter, search } = req.query;
    if (status) filter.subscriptionStatus = status;
    if (isAdmin(req.user) && recruiter && mongoose.isValidObjectId(recruiter)) filter.assignedRecruiter = recruiter;
    if (search?.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const userIds = await User.find({ accountType: "Candidate", $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] }).distinct("_id");
      filter.$or = [{ candidateId: regex }, { primaryJobRole: regex }, { location: regex }, { user: { $in: userIds } }];
    }

    const [data, total] = await Promise.all([
      Candidate.find(filter).populate(candidatePopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Candidate.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, ...paginatedResponse({ page, limit, total, data }) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyCandidateProfile = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ user: req.user.id }).populate(candidatePopulate);
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate profile not found" });
    return res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });
    const editable = ["phone", "location", "primaryJobRole", "experience", "subscriptionStartDate", "subscriptionEndDate", "subscriptionStatus", "resumeStatus", "resumeUrl", "notes"];
    editable.forEach((field) => { if (req.body[field] !== undefined) candidate[field] = req.body[field]; });
    if (req.body.skills !== undefined) candidate.skills = normalizeSkills(req.body.skills);
    if (!validDateRange(candidate.subscriptionStartDate, candidate.subscriptionEndDate)) {
      return res.status(400).json({ success: false, message: "Subscription dates are invalid" });
    }
    await candidate.save();
    await candidate.populate(candidatePopulate);
    return res.status(200).json({ success: true, message: "Candidate updated successfully", data: candidate });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignCandidate = async (req, res) => {
  try {
    const { recruiterId } = req.body;
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(recruiterId)) {
      return res.status(400).json({ success: false, message: "Invalid candidate or recruiter" });
    }
    const [candidate, recruiter] = await Promise.all([
      Candidate.findById(req.params.id),
      User.findOne({ _id: recruiterId, accountType: "Employee", isActive: true }),
    ]);
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });
    if (!recruiter) return res.status(404).json({ success: false, message: "Active employee not found" });
    if (String(candidate.assignedRecruiter || "") === String(recruiterId)) {
      return res.status(400).json({ success: false, message: "Candidate is already assigned to this employee" });
    }

    await CandidateAssignment.create({
      candidate: candidate._id,
      previousRecruiter: candidate.assignedRecruiter || null,
      recruiter: recruiterId,
      assignedBy: req.user.id,
    });
    candidate.assignedRecruiter = recruiterId;
    candidate.assignedAt = new Date();
    await candidate.save();
    await candidate.populate(candidatePopulate);
    return res.status(200).json({ success: true, message: "Candidate assigned successfully", data: candidate });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetCandidatePassword = async (req, res) => {
  try {
    const { temporaryPassword } = req.body;
    if (!temporaryPassword || temporaryPassword.length < 6) return res.status(400).json({ success: false, message: "Temporary password must be at least 6 characters" });
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });
    const user = await User.findOne({ _id: candidate.user, accountType: "Candidate" }).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "Candidate login not found" });
    user.password = await bcrypt.hash(temporaryPassword, 10);
    await user.save();
    return res.status(200).json({ success: true, message: "Candidate password reset successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadCandidateResume = async (req, res) => {
  try {
    const { dataUrl, fileName, mimeType, size } = req.body;
    const fileSize = Number(size || 0);
    if (mimeType !== "application/pdf" || !fileSize || fileSize > 8 * 1024 * 1024 || typeof dataUrl !== "string" || !dataUrl.startsWith("data:application/pdf;base64,")) {
      return res.status(400).json({ success: false, message: "Upload a PDF resume up to 8 MB" });
    }
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });
    const safeName = String(fileName || "resume.pdf").replace(/[^\w.\- ()]/g, "").slice(0, 140) || "resume.pdf";
    const result = await cloudinary.uploader.upload(dataUrl, {
      public_id: `candidate-resumes/${candidate.candidateId}-${Date.now()}.pdf`,
      resource_type: "raw",
      unique_filename: true,
    });
    const previousPublicId = candidate.resumeFile?.publicId;
    candidate.resumeFile = { url: result.secure_url, publicId: result.public_id, fileName: safeName, size: fileSize, uploadedAt: new Date(), uploadedBy: req.user.id };
    await candidate.save();
    if (previousPublicId) cloudinary.uploader.destroy(previousPublicId, { resource_type: "raw" }).catch(() => {});
    await candidate.populate(candidatePopulate);
    return res.status(200).json({ success: true, message: "Latest resume uploaded", data: candidate });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to upload resume", error: error.message });
  }
};

exports.getMyInterviews = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ user: req.user.id }).select("_id");
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate profile not found" });
    const data = await Interview.find({ candidate: candidate._id })
      .populate("recruiter", "firstName lastName email designation image")
      .sort({ scheduledAt: 1 });
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createJobApplication = async (req, res) => {
  try {
    if (req.user.accountType !== "Employee") return res.status(403).json({ success: false, message: "Only employees can submit job applications" });
    const { candidateId } = req.body;
    const submittedUrls = Array.isArray(req.body.urls)
      ? req.body.urls
      : String(req.body.urls || req.body.appliedUrl || "").split(/\r?\n/);
    if (!candidateId || !submittedUrls.length) return res.status(400).json({ success: false, message: "Candidate and at least one job URL are required" });
    if (submittedUrls.length > 200) return res.status(400).json({ success: false, message: "A maximum of 200 URLs can be saved at once" });
    const candidate = await Candidate.findOne({ _id: candidateId, assignedRecruiter: req.user.id });
    if (!candidate) return res.status(403).json({ success: false, message: "This candidate is not assigned to you" });
    if (!["Active", "Trial", "Expiring Soon"].includes(candidate.subscriptionStatus)) {
      return res.status(400).json({ success: false, message: "Applications cannot be added for an inactive subscription" });
    }
    const cleaned = submittedUrls.map((value) => String(value || "").trim()).filter(Boolean);
    const valid = cleaned.filter(validUrl);
    const invalidCount = cleaned.length - valid.length;
    const uniqueUrls = [...new Set(valid)];
    const duplicateInBatchCount = valid.length - uniqueUrls.length;
    const existingUrls = await JobApplication.find({ candidate: candidate._id, appliedUrl: { $in: uniqueUrls } }).distinct("appliedUrl");
    const existingSet = new Set(existingUrls);
    const newUrls = uniqueUrls.filter((url) => !existingSet.has(url));
    const duplicateCount = duplicateInBatchCount + existingUrls.length;
    if (!newUrls.length) {
      return res.status(400).json({ success: false, message: "No new valid job URLs to save", summary: { saved: 0, duplicates: duplicateCount, invalid: invalidCount } });
    }

    const batchId = crypto.randomUUID();
    const appliedAt = new Date();
    const workDate = getShiftDate(appliedAt);
    const applications = await JobApplication.insertMany(newUrls.map((appliedUrl) => ({
      candidate: candidate._id,
      submittedBy: req.user.id,
      appliedAt,
      workDate,
      appliedUrl,
      batchId,
    })));
    await JobApplication.populate(applications, [
      { path: "candidate", populate: { path: "user", select: "firstName lastName email" } },
      { path: "submittedBy", select: "firstName lastName employeeId" },
    ]);
    return res.status(201).json({
      success: true,
      message: `${applications.length} job application${applications.length === 1 ? "" : "s"} saved`,
      data: applications,
      summary: { saved: applications.length, duplicates: duplicateCount, invalid: invalidCount },
    });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getJobApplications = async (req, res) => {
  try {
    await backfillApplicationWorkDates();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 2000);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.user.accountType === "Candidate") {
      const candidate = await Candidate.findOne({ user: req.user.id }).select("_id");
      if (!candidate) return res.status(404).json({ success: false, message: "Candidate profile not found" });
      filter.candidate = candidate._id;
    } else if (req.user.accountType === "Employee") {
      filter.submittedBy = req.user.id;
      if (req.query.candidateId) {
        const assigned = await Candidate.exists({ _id: req.query.candidateId, assignedRecruiter: req.user.id });
        if (!assigned) return res.status(403).json({ success: false, message: "Candidate access denied" });
        filter.candidate = req.query.candidateId;
      }
    } else if (isAdmin(req.user)) {
      if (req.query.candidateId && mongoose.isValidObjectId(req.query.candidateId)) filter.candidate = req.query.candidateId;
      if (req.query.recruiterId && mongoose.isValidObjectId(req.query.recruiterId)) filter.submittedBy = req.query.recruiterId;
    } else return res.status(403).json({ success: false, message: "Access denied" });

    if (req.query.status) filter.status = req.query.status;
    const [data, total] = await Promise.all([
      JobApplication.find(filter)
        .populate({ path: "candidate", select: "candidateId primaryJobRole user", populate: { path: "user", select: "firstName lastName email" } })
        .populate("submittedBy", "firstName lastName employeeId designation")
        .sort({ appliedAt: -1 }).skip(skip).limit(limit),
      JobApplication.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, currentWorkDate: getShiftDate(), ...paginatedResponse({ page, limit, total, data }) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
