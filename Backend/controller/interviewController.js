const mongoose = require("mongoose");
const Interview = require("../model/Interview");
const User = require("../model/User");
const { getPagination, paginatedResponse } = require("../utils/pagination");

const isAdmin = (user) => ["Admin", "SuperAdmin"].includes(user.accountType);
const populateRecruiter = (query) =>
  query.populate("recruiter", "firstName lastName email employeeId department designation");

const validateDates = (emailReceivedDate, scheduledAt) => {
  const received = new Date(emailReceivedDate);
  const scheduled = new Date(scheduledAt);
  if (Number.isNaN(received.getTime()) || Number.isNaN(scheduled.getTime())) {
    return "Please provide valid email received and scheduled dates";
  }
  return null;
};

exports.createInterview = async (req, res) => {
  try {
    const {
      candidateName,
      emailReceivedDate,
      jobTitle,
      companyName,
      interviewEmail,
      scheduledAt,
      interviewRound,
      status,
      notes,
    } = req.body;

    if (![candidateName, emailReceivedDate, jobTitle, companyName, interviewEmail, scheduledAt].every(Boolean)) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    const dateError = validateDates(emailReceivedDate, scheduledAt);
    if (dateError) return res.status(400).json({ success: false, message: dateError });

    const recruiter = await User.findOne({ _id: req.user.id, isActive: true });
    if (!recruiter) {
      return res.status(404).json({ success: false, message: "Logged-in employee not found" });
    }

    const interview = await Interview.create({
      recruiter: req.user.id,
      candidateName,
      emailReceivedDate,
      jobTitle,
      companyName,
      interviewEmail,
      scheduledAt,
      interviewRound,
      status,
      notes,
    });

    await interview.populate("recruiter", "firstName lastName email employeeId department designation");
    return res.status(201).json({ success: true, message: "Interview added successfully", data: interview });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInterviews = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = isAdmin(req.user) ? {} : { recruiter: req.user.id };
    const { status, round, recruiter, search } = req.query;

    if (status) filter.status = status;
    if (round) filter.interviewRound = round;
    if (isAdmin(req.user) && recruiter && mongoose.isValidObjectId(recruiter)) filter.recruiter = recruiter;
    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ candidateName: regex }, { companyName: regex }, { jobTitle: regex }, { interviewEmail: regex }];
    }

    const [interviews, total] = await Promise.all([
      populateRecruiter(Interview.find(filter).sort({ scheduledAt: -1 }).skip(skip).limit(limit)),
      Interview.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, ...paginatedResponse({ page, limit, total, data: interviews }) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInterviewById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.interviewId)) {
      return res.status(400).json({ success: false, message: "Invalid interview ID" });
    }
    const filter = { _id: req.params.interviewId };
    if (!isAdmin(req.user)) filter.recruiter = req.user.id;
    const interview = await populateRecruiter(Interview.findOne(filter));
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found" });
    return res.status(200).json({ success: true, data: interview });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateInterview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.interviewId)) {
      return res.status(400).json({ success: false, message: "Invalid interview ID" });
    }
    const filter = { _id: req.params.interviewId };
    if (!isAdmin(req.user)) filter.recruiter = req.user.id;
    const interview = await Interview.findOne(filter);
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found or access denied" });

    const editable = [
      "candidateName", "emailReceivedDate", "jobTitle", "companyName", "interviewEmail",
      "scheduledAt", "interviewRound", "status", "notes",
    ];
    editable.forEach((field) => {
      if (req.body[field] !== undefined) interview[field] = req.body[field];
    });
    if (req.body.emailReceivedDate !== undefined || req.body.scheduledAt !== undefined) {
      const dateError = validateDates(interview.emailReceivedDate, interview.scheduledAt);
      if (dateError) return res.status(400).json({ success: false, message: dateError });
    }

    await interview.save();
    await interview.populate("recruiter", "firstName lastName email employeeId department designation");
    return res.status(200).json({ success: true, message: "Interview updated successfully", data: interview });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
