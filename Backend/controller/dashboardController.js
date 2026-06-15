const User = require("../model/User");
const Attendance = require("../model/Attendance");
const Leave = require("../model/Leave");
const Payroll = require("../model/Payroll");
const BreakLog = require("../model/BreakLog");
const moment = require("moment-timezone");
const Submission = require("../model/Submission");

const TZ = "Asia/Kolkata";
const getShiftDate = (time = moment().tz(TZ)) => {
  const localTime = moment(time).tz(TZ);
  return localTime.hour() < 12
    ? localTime.clone().subtract(1, "day").format("YYYY-MM-DD")
    : localTime.format("YYYY-MM-DD");
};


// ==========================================
// ADMIN DASHBOARD
// ==========================================
exports.getAdminDashboard = async (req, res) => {
  try {

    const today =
      getShiftDate();

    const totalEmployees =
      await User.countDocuments({
        accountType: "Employee",
        isActive: true,
      });

    const presentToday =
      await Attendance.countDocuments({
        attendanceDate: today,
        status: {
          $in: ["Present", "Half Day"],
        },
      });

    const weekendToday =
      await Attendance.countDocuments({
        attendanceDate: today,
        status: "Weekend",
      });

    const leaveToday =
      await Leave.countDocuments({
        status: "Approved",
        startDate: {
          $lte: new Date(),
        },
        endDate: {
          $gte: new Date(),
        },
      });

    const activeBreaks =
      await BreakLog.countDocuments({
        status: "Active",
      });

    const checkedOut =
      await Attendance.countDocuments({
        attendanceDate: today,
        checkOut: {
          $ne: null,
        },
      });

    const lateEmployees =
      await Attendance.countDocuments({
        attendanceDate: today,
        lateArrival: true,
      });

    const absentToday = Math.max(
      totalEmployees -
        presentToday -
        leaveToday -
        weekendToday,
      0
    );

    const currentMonth =
      moment().month() + 1;

    const currentYear =
      moment().year();

    const payrolls =
      await Payroll.find({
        month: currentMonth,
        year: currentYear,
      });

    const monthlyPayroll =
      payrolls.reduce(
        (sum, payroll) =>
          sum + payroll.netSalary,
        0
      );

    return res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        absentToday,
        leaveToday,
        weekendToday,
        activeBreaks,
        checkedOut,
        lateEmployees,
        monthlyPayroll: Number(
          monthlyPayroll.toFixed(2)
        ),
      },
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
// LIVE EMPLOYEE STATUS
// ==========================================
// ==========================================
// LIVE EMPLOYEE STATUS
// ==========================================
exports.getLiveEmployees = async (req, res) => {
  try {

    const today =
      getShiftDate();

    const attendance =
      await Attendance.find({
        attendanceDate: today,
      })
        .populate(
          "employee",
          "firstName lastName employeeId department designation"
        )
        .sort({
          checkIn: 1,
        });

    const result =
      await Promise.all(
        attendance.map(
          async (record) => {

            const breaks = await BreakLog.find({
              attendance: record._id,
            });

            const activeBreak = breaks.find(
              (b) => b.status === "Active"
            );

            let status = "Working";

            if (record.status === "Leave") {
              status = "On Leave";
            } else if (record.status === "Weekend") {
              status = "Weekend";
            } else if (record.checkOut) {
              status = "Checked Out";
            } else if (activeBreak) {
              status = "On Break";
            }

            const totalBreakMinutes = breaks.reduce((sum, b) => {
              if (b.duration) return sum + b.duration;
              if (b.status === "Active" && b.breakStart) {
                return sum + moment().tz(TZ).diff(moment(b.breakStart), "minutes");
              }
              return sum;
            }, 0);

            return {
              employee:
                record.employee,

              status,

              checkIn:
                record.checkIn,

              checkOut:
                record.checkOut,

              totalHours:
                record.totalHours,

              productiveHours:
                record.productiveHours,

              lateArrival:
                record.lateArrival,

              overtimeHours:
                record.overtimeHours,

              totalBreakMinutes,

              breakCount: breaks.length,
            };
          }
        )
      );

    return res.status(200).json({
      success: true,
      count:
        result.length,
      data: result,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ==========================================
// SINGLE EMPLOYEE DASHBOARD
// ==========================================
// ==========================================
// SINGLE EMPLOYEE DASHBOARD
// ==========================================
exports.getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const employee = await User.findById(employeeId).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const today = getShiftDate();

    // Today's attendance
    const attendance = await Attendance.findOne({
      employee: employeeId,
      attendanceDate: today,
    });

    // Active break
    const activeBreak = await BreakLog.findOne({
      employee: employeeId,
      status: "Active",
    });

    // Today's breaks + total break time
    let todayBreaks = [];
    let totalBreakMinutes = 0;

    if (attendance) {
      todayBreaks = await BreakLog.find({
        attendance: attendance._id,
      }).sort({ breakStart: -1 });

      totalBreakMinutes = todayBreaks.reduce((sum, b) => {
        if (b.duration) return sum + b.duration;
        if (b.status === "Active" && b.breakStart) {
          return sum + moment().tz(TZ).diff(moment(b.breakStart), "minutes");
        }
        return sum;
      }, 0);
    }

    // Leave summary
    const totalLeaves = await Leave.countDocuments({
      employee: employeeId,
    });

    const approvedLeaves = await Leave.countDocuments({
      employee: employeeId,
      status: "Approved",
    });

    const pendingLeaves = await Leave.countDocuments({
      employee: employeeId,
      status: "Pending",
    });

    const rejectedLeaves = await Leave.countDocuments({
      employee: employeeId,
      status: "Rejected",
    });

    // Submission count
    const totalSubmissions = await Submission.countDocuments({
      recruiter: employeeId,
    });

    // Latest payroll
    const latestPayroll = await Payroll.findOne({
      employee: employeeId,
    }).sort({
      year: -1,
      month: -1,
    });

    // Recent attendance history
    const recentAttendance = await Attendance.find({
      employee: employeeId,
    })
      .sort({
        attendanceDate: -1,
      })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        employee,
        attendance,
        activeBreak,
        todayBreaks,
        totalBreakMinutes,
        leaves: {
          total: totalLeaves,
          approved: approvedLeaves,
          pending: pendingLeaves,
          rejected: rejectedLeaves,
        },
        totalSubmissions,
        latestPayroll,
        recentAttendance,
      },
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
// DEPARTMENT ANALYTICS
// ==========================================
exports.getDepartmentAnalytics =
  async (req, res) => {
    try {

      const departments =
        await User.aggregate([
          {
            $match: {
              accountType:
                "Employee",
              isActive: true,
            },
          },
          {
            $group: {
              _id:
                "$department",

              totalEmployees:
                {
                  $sum: 1,
                },
            },
          },
          {
            $sort: {
              totalEmployees:
                -1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: departments,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

  // ==========================================
// TODAY ATTENDANCE
// ==========================================
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = getShiftDate();

    const attendance = await Attendance.find({
      attendanceDate: today,
    })
      .populate(
        "employee",
        "firstName lastName employeeId department designation"
      )
      .sort({
        checkIn: 1,
      });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// EMPLOYEES ON BREAK
// ==========================================
exports.getEmployeesOnBreak = async (req, res) => {
  try {

    const breaks = await BreakLog.find({
      status: "Active",
    })
      .populate(
        "employee",
        "firstName lastName employeeId department designation"
      )
      .sort({
        breakStart: -1,
      });

    return res.status(200).json({
      success: true,
      count: breaks.length,
      data: breaks,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// LATE EMPLOYEES
// ==========================================
exports.getLateEmployees = async (req, res) => {
  try {

    const today = getShiftDate();

    const employees = await Attendance.find({
      attendanceDate: today,
      lateArrival: true,
    }).populate(
      "employee",
      "firstName lastName employeeId department designation"
    );

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// EMPLOYEE TIMELINE
// ==========================================
exports.getEmployeeTimeline = async (req, res) => {
  try {

    const { employeeId } = req.params;

    const attendance = await Attendance.find({
      employee: employeeId,
    })
      .populate("breakLogs")
      .sort({
        attendanceDate: -1,
      });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ADMIN: SINGLE EMPLOYEE DETAIL (profile + today + breaks)
exports.getEmployeeDetailForAdmin = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = getShiftDate();

    const employee = await User.findById(employeeId)
      .populate("additionalDetails")
      .select("-password");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const attendance = await Attendance.findOne({ employee: employeeId, attendanceDate: today });
    const activeBreak = await BreakLog.findOne({ employee: employeeId, status: "Active" });

    let breaks = [];
    if (attendance) {
      breaks = await BreakLog.find({ attendance: attendance._id }).sort({ breakStart: -1 });
    }

    return res.status(200).json({
      success: true,
      data: { employee, attendance, activeBreak, breaks },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ADMIN: SINGLE EMPLOYEE DETAIL (profile + today + breaks)
// ==========================================
exports.getEmployeeDetailForAdmin = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = getShiftDate();

    const employee = await User.findById(employeeId)
      .populate("additionalDetails")
      .select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const attendance = await Attendance.findOne({
      employee: employeeId,
      attendanceDate: today,
    });

    const activeBreak = await BreakLog.findOne({
      employee: employeeId,
      status: "Active",
    });

    let breaks = [];
    if (attendance) {
      breaks = await BreakLog.find({
        attendance: attendance._id,
      }).sort({ breakStart: -1 });
    }

    return res.status(200).json({
      success: true,
      data: {
        employee,
        attendance,
        activeBreak,
        breaks,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
