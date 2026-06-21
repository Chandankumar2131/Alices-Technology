const Submission = require("../model/Submission");
const { getPagination, paginatedResponse } = require("../utils/pagination");

// ==========================================
// CREATE SUBMISSION
// ==========================================

exports.createSubmission = async (req, res) => {
  try {
    const {
      candidateName,
      candidateEmail,
      candidatePhone,
      jobTitle,
      portal,
    } = req.body;

    if (
      !candidateName ||
      !candidateEmail ||
      !candidatePhone ||
      !jobTitle
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory",
      });
    }

    const submission = await Submission.create({
      recruiter: req.user.id,
      candidateName,
      candidateEmail,
      candidatePhone,
      jobTitle,
      portal,
    });

    return res.status(201).json({
      success: true,
      message: "Submission created successfully",
      data: submission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// GET MY SUBMISSIONS
// ==========================================
exports.getMySubmissions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {
      recruiter: req.user.id,
    };

    const submissions = await Submission.find(filter)
      .populate(
        "recruiter",
        "firstName lastName employeeId"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Submission.countDocuments(filter);

    return res.status(200).json({
      success: true,
      ...paginatedResponse({ page, limit, total, data: submissions }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// UPDATE SUBMISSION STATUS
// ==========================================
exports.updateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const { status } = req.body;

    const submission =
      await Submission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    submission.status = status;

    await submission.save();

    return res.status(200).json({
      success: true,
      message: "Submission updated successfully",
      data: submission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// ADMIN - GET ALL SUBMISSIONS
// ==========================================
exports.getAllSubmissions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const submissions = await Submission.find()
      .populate(
        "recruiter",
        "firstName lastName employeeId department designation"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Submission.countDocuments();

    return res.status(200).json({
      success: true,
      ...paginatedResponse({ page, limit, total, data: submissions }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// ADMIN - GET SINGLE SUBMISSION
// ==========================================
exports.getSubmissionById = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission =
      await Submission.findById(submissionId)
        .populate(
          "recruiter",
          "firstName lastName employeeId department designation"
        );
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// DELETE SUBMISSION
// ==========================================
exports.deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission =
      await Submission.findByIdAndDelete(
        submissionId
      );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
