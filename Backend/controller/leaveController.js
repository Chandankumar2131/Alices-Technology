const Leave = require("../model/Leave");
const Attendance = require("../model/Attendance");
const moment = require("moment");

// ==========================================
// APPLY LEAVE
// ==========================================
exports.applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const {
      leaveType,
      startDate,
      endDate,
      reason,
    } = req.body;

    if (
      !leaveType ||
      !startDate ||
      !endDate ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message:
          "Start date cannot be greater than end date",
      });
    }

    const totalDays =
      Math.ceil(
        (end - start) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    const leave = await Leave.create({
      employee: employeeId,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
    });

    return res.status(201).json({
      success: true,
      message:
        "Leave applied successfully",
      data: leave,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET MY LEAVES
// ==========================================
exports.getMyLeaves = async (
  req,
  res
) => {
  try {

    const leaves =
      await Leave.find({
        employee: req.user.id,
      }).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN - GET ALL LEAVES
// ==========================================
exports.getAllLeaves = async (
  req,
  res
) => {
  try {

    const leaves =
      await Leave.find()
        .populate(
          "employee",
          "firstName lastName email employeeId"
        )
        .populate(
          "approvedBy",
          "firstName lastName"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN - APPROVE LEAVE
// ==========================================
exports.approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { adminRemarks } = req.body;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    // Prevent multiple approvals/rejections
    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Leave already ${leave.status}`,
      });
    }

    // Approve Leave
    leave.status = "Approved";
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    leave.adminRemarks = adminRemarks;

    await leave.save();

    // ==========================================
    // CREATE ATTENDANCE RECORDS FOR LEAVE DAYS
    // ==========================================

    let currentDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);

    while (currentDate <= endDate) {
      const day = currentDate.getDay();

      // Skip Saturday(6) and Sunday(0)
      if (day !== 0 && day !== 6) {
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);

        await Attendance.findOneAndUpdate(
          {
            employee: leave.employee,
            date: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
          {
            employee: leave.employee,
            date: startOfDay,
            status: "Leave",
            remarks: `Approved ${leave.leaveType}`,
          },
          {
            upsert: true,
            new: true,
          }
        );
      }

      currentDate.setDate(
        currentDate.getDate() + 1
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Leave approved successfully and attendance updated",
      data: leave,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN - REJECT LEAVE
// ==========================================
exports.rejectLeave =async (req, res) => {
    try {

      const { leaveId } =
        req.params;

      const {
        adminRemarks,
      } = req.body;

      const leave =
        await Leave.findById(
          leaveId
        );

      if (!leave) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Leave not found",
          });
      }

      leave.status =
        "Rejected";

      leave.approvedBy =
        req.user.id;

      leave.approvedAt =
        new Date();

      leave.adminRemarks =
        adminRemarks;

      await leave.save();

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Leave rejected successfully",
          data: leave,
        });

    } catch (error) {

      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message,
        });
    }
  };

// ==========================================
// GET SINGLE LEAVE
// ==========================================
exports.getLeaveById =  async (req, res) => {
    try {

      const { leaveId } =
        req.params;

      const leave =
        await Leave.findById(
          leaveId
        )
          .populate(
            "employee"
          )
          .populate(
            "approvedBy"
          );

      if (!leave) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Leave not found",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          data: leave,
        });

    } catch (error) {

      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message,
        });
    }
  };