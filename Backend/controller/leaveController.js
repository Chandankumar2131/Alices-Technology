const Leave = require("../model/Leave");
const Attendance = require("../model/Attendance");
const User = require("../model/User");
const moment = require("moment");
const { getPagination, paginatedResponse } = require("../utils/pagination");
const {
  syncLeaveBalance,
  consumeLeaveBalance,
  monthsCompleted,
  SICK_ELIGIBILITY_MONTHS,
  CASUAL_ELIGIBILITY_MONTHS,
} = require("../utils/leaveBucket");

const emitAdminNotifications = (req) => {
  req.app?.get("io")?.to("role:admin").emit("admin:notifications", {
    type: "leave",
    at: new Date().toISOString(),
  });
};

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

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const completedMonths = monthsCompleted(employee.joiningDate || employee.createdAt);

    if (
      (leaveType === "Sick Leave" || leaveType === "Emergency Leave") &&
      completedMonths < SICK_ELIGIBILITY_MONTHS
    ) {
      return res.status(400).json({
        success: false,
        message: "Sick leave is available after 3 months of service",
      });
    }

    if (leaveType === "Casual Leave" && completedMonths < CASUAL_ELIGIBILITY_MONTHS) {
      return res.status(400).json({
        success: false,
        message: "Casual leave is available after 6 months of continuous service",
      });
    }

    if (leaveType === "Sick Leave") {
      const hoursUntilStart = moment(start).diff(moment(), "hours", true);
      if (hoursUntilStart > 0 && hoursUntilStart < 24) {
        return res.status(400).json({
          success: false,
          message: "Planned sick leave should be informed at least 24 hours in advance",
        });
      }
    }

    const leave = await Leave.create({
      employee: employeeId,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
    });

    emitAdminNotifications(req);

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
// GET MY LEAVE BUCKET
// ==========================================
exports.getMyLeaveBucket = async (req, res) => {
  try {
    const employee = await User.findById(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const balance = await syncLeaveBalance(employee);
    const serviceStartDate = employee.joiningDate || employee.createdAt;
    const completedMonths = monthsCompleted(serviceStartDate);
    const sickEligibleFrom = moment(serviceStartDate).add(SICK_ELIGIBILITY_MONTHS, "months").toDate();
    const casualEligibleFrom = moment(serviceStartDate).add(CASUAL_ELIGIBILITY_MONTHS, "months").toDate();

    return res.status(200).json({
      success: true,
      data: {
        ...balance.toObject(),
        eligibility: {
          serviceStartDate,
          serviceMonthsCompleted: completedMonths,
          sickEligibleFrom,
          casualEligibleFrom,
          sickLeaveEligible: completedMonths >= SICK_ELIGIBILITY_MONTHS,
          casualLeaveEligible: completedMonths >= CASUAL_ELIGIBILITY_MONTHS,
        },
      },
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
    const { page, limit, skip } = getPagination(req.query);
    const filter = {
      employee: req.user.id,
    };

    const leaves =
      await Leave.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit);

    const total = await Leave.countDocuments(filter);

    return res.status(200).json({
      success: true,
      ...paginatedResponse({ page, limit, total, data: leaves }),
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
    const { page, limit, skip } = getPagination(req.query);

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
        })
        .skip(skip)
        .limit(limit);

    const total = await Leave.countDocuments();

    return res.status(200).json({
      success: true,
      ...paginatedResponse({ page, limit, total, data: leaves }),
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

    const employee = await User.findById(leave.employee);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const balance = await syncLeaveBalance(employee);
    const { paidDays, unpaidDays } = await consumeLeaveBalance(
      balance,
      leave.leaveType,
      leave.totalDays
    );

    // Approve Leave
    leave.status = "Approved";
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    leave.adminRemarks = adminRemarks;
    leave.paidDays = paidDays;
    leave.unpaidDays = unpaidDays;

    await leave.save();
    emitAdminNotifications(req);

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

        const attendanceDate = moment(currentDate).format("YYYY-MM-DD");
        const existingAttendance = await Attendance.findOne({
          employee: leave.employee,
          attendanceDate,
        });

        if (existingAttendance?.checkIn) {
          existingAttendance.remarks = existingAttendance.remarks
            ? `${existingAttendance.remarks} | Approved leave skipped because employee checked in`
            : "Approved leave skipped because employee checked in";
          await existingAttendance.save();
          currentDate.setDate(
            currentDate.getDate() + 1
          );
          continue;
        }

        await Attendance.findOneAndUpdate(
          {
            employee: leave.employee,
            attendanceDate,
          },
          {
            employee: leave.employee,
            date: startOfDay,
            attendanceDate,
            dayName: moment(currentDate).format("dddd"),
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
      emitAdminNotifications(req);

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
            "employee",
            "firstName lastName email employeeId department designation"
          )
          .populate(
            "approvedBy",
            "firstName lastName email employeeId"
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
