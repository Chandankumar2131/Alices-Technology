const User = require("../model/User");
const Attendance = require("../model/Attendance");
const Leave = require("../model/Leave");
const Payroll = require("../model/Payroll");
const BreakLog = require("../model/BreakLog");
const AttendanceCorrection = require("../model/AttendanceCorrection");
const Candidate = require("../model/Candidate");
const Holiday = require("../model/Holiday");
const { syncLeaveBalance } = require("../utils/leaveBucket");
const moment = require("moment-timezone");
const {
  TZ,
  CHECK_IN_START,
  CHECK_IN_END,
  getShiftDate,
  getShiftBoundary,
} = require("../utils/attendanceShift");

const getLiveAttendanceHours = (attendance, totalBreakMinutes) => {
  if (!attendance?.checkIn) {
    return {
      totalHours: 0,
      productiveHours: 0,
    };
  }

  if (attendance.checkOut) {
    return {
      totalHours: Number((attendance.totalHours || 0).toFixed(2)),
      productiveHours: Number((attendance.productiveHours || 0).toFixed(2)),
    };
  }

  const totalMinutes = moment().tz(TZ).diff(moment(attendance.checkIn), "minutes");
  const totalHours = Math.max(totalMinutes, 0) / 60;
  const productiveMinutes = Math.max(totalMinutes - totalBreakMinutes, 0);
  return {
    totalHours: Number(totalHours.toFixed(2)),
    productiveHours: Number((productiveMinutes / 60).toFixed(2)),
  };
};

const getLiveProductiveHours = (attendance, totalBreakMinutes) => {
  return getLiveAttendanceHours(attendance, totalBreakMinutes).productiveHours;
};

const getLateArrivalMinutes = (attendance) => {
  if (!attendance?.checkIn || !attendance.lateArrival) return 0;

  const checkIn = moment(attendance.checkIn).tz(TZ);
  const scheduledStart = getShiftBoundary(attendance.attendanceDate, CHECK_IN_START);
  const lateThreshold = getShiftBoundary(attendance.attendanceDate, CHECK_IN_END);

  if (!checkIn.isAfter(lateThreshold)) return 0;

  return Math.max(checkIn.diff(scheduledStart, "minutes"), 0);
};

const hasApprovedLeaveForDate = async (employeeId, dateKey) => {
  const startOfDay = moment.tz(dateKey, "YYYY-MM-DD", TZ).startOf("day").toDate();
  const endOfDay = moment.tz(dateKey, "YYYY-MM-DD", TZ).endOf("day").toDate();

  return !!(await Leave.exists({
    employee: employeeId,
    status: "Approved",
    startDate: {
      $lte: endOfDay,
    },
    endDate: {
      $gte: startOfDay,
    },
  }));
};

const reconcileLeaveAttendance = async (record) => {
  if (!record || record.status !== "Leave") return record;

  const approvedLeaveExists = await hasApprovedLeaveForDate(
    record.employee,
    record.attendanceDate
  );

  if (approvedLeaveExists) return record;

  if (!record.checkIn && record.attendanceDate > getShiftDate()) {
    await record.deleteOne();
    return null;
  }

  record.status = record.checkIn ? "Present" : "Absent";
  record.remarks = record.remarks
    ? `${record.remarks} | Leave record cleared because approved leave was not found`
    : "Leave record cleared because approved leave was not found";

  await record.save();
  return record;
};


// ==========================================
// ADMIN DASHBOARD
// ==========================================
exports.getAdminDashboard = async (req, res) => {
  try {

    const today =
      getShiftDate();

    const employeeIds = await User.distinct("_id", {
      accountType: "Employee",
      isActive: true,
    });

    const totalEmployees = employeeIds.length;
    const totalCandidates = await Candidate.countDocuments();

    const presentToday =
      await Attendance.countDocuments({
        employee: {
          $in: employeeIds,
        },
        attendanceDate: today,
        status: {
          $in: ["Present", "Half Day"],
        },
      });

    const weekendToday =
      await Attendance.countDocuments({
        employee: {
          $in: employeeIds,
        },
        attendanceDate: today,
        status: "Weekend",
      });

    const leaveToday =
      await Leave.countDocuments({
        employee: {
          $in: employeeIds,
        },
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
        employee: {
          $in: employeeIds,
        },
        status: "Active",
      });

    const lateEmployees =
      await Attendance.countDocuments({
        employee: {
          $in: employeeIds,
        },
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
        employee: {
          $in: employeeIds,
        },
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
        totalCandidates,
        presentToday,
        absentToday,
        leaveToday,
        weekendToday,
        activeBreaks,
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

    const employeeIds = await User.distinct("_id", {
      accountType: "Employee",
      isActive: true,
    });

    const attendance =
      await Attendance.find({
        employee: {
          $in: employeeIds,
        },
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

            const liveHours = getLiveAttendanceHours(record, totalBreakMinutes);

            return {
              employee:
                record.employee,

              status,

              checkIn:
                record.checkIn,

              checkOut:
                record.checkOut,

              totalHours:
                liveHours.totalHours,

              productiveHours:
                liveHours.productiveHours,

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
    let attendance = await Attendance.findOne({
      employee: employeeId,
      attendanceDate: today,
    });

    attendance = await reconcileLeaveAttendance(attendance);

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

    const liveHours = getLiveAttendanceHours(
      attendance,
      totalBreakMinutes
    );

    const monthStart = moment().tz(TZ).startOf("month").format("YYYY-MM-DD");
    const monthEnd = moment().tz(TZ).endOf("month").format("YYYY-MM-DD");

    const presentThisMonth = await Attendance.countDocuments({
      employee: employeeId,
      attendanceDate: {
        $gte: monthStart,
        $lte: monthEnd,
      },
      status: "Present",
    });

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

    const leaveBucket = await syncLeaveBalance(employee);

    // Latest payroll
    const latestPayroll = await Payroll.findOne({
      employee: employeeId,
    }).sort({
      year: -1,
      month: -1,
    });

    // Recent attendance history
    const recentAttendanceRecords = await Attendance.find({
      employee: employeeId,
      attendanceDate: {
        $lte: today,
      },
    })
      .sort({
        attendanceDate: -1,
      })
      .limit(5);

    const recentAttendance = (await Promise.all(
      recentAttendanceRecords.map((record) => reconcileLeaveAttendance(record))
    )).filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        employee,
        attendance,
        lateArrivalMinutes: getLateArrivalMinutes(attendance),
        activeBreak,
        todayBreaks,
        totalBreakMinutes,
        liveTotalHours: liveHours.totalHours,
        liveProductiveHours: liveHours.productiveHours,
        monthlyAttendance: {
          present: presentThisMonth,
          monthStart,
          monthEnd,
        },
        leaves: {
          total: totalLeaves,
          approved: approvedLeaves,
          pending: pendingLeaves,
          rejected: rejectedLeaves,
          bucket: leaveBucket,
        },
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

    const employeeIds = await User.distinct("_id", {
      accountType: "Employee",
      isActive: true,
    });

    const attendance = await Attendance.find({
      employee: {
        $in: employeeIds,
      },
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

    const employeeIds = await User.distinct("_id", {
      accountType: "Employee",
      isActive: true,
    });

    const breaks = await BreakLog.find({
      employee: {
        $in: employeeIds,
      },
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

    const employeeIds = await User.distinct("_id", {
      accountType: "Employee",
      isActive: true,
    });

    const employees = await Attendance.find({
      employee: {
        $in: employeeIds,
      },
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
    const requestedMonth = req.query.month || moment().tz(TZ).format("YYYY-MM");
    const month = moment.tz(requestedMonth, "YYYY-MM", true, TZ);

    if (!month.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Month must use YYYY-MM format",
      });
    }

    const employee = await User.findById(employeeId).select(
      "joiningDate employmentEndDate isActive updatedAt resignation.lastWorkingDay resignation.status"
    );
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const today = moment.tz(getShiftDate(), "YYYY-MM-DD", TZ);
    const monthStart = month.clone().startOf("month");
    const recordedEndDate = employee.employmentEndDate ||
      (employee.resignation?.status === "Approved" ? employee.resignation.lastWorkingDay : null);
    const effectiveEndDate = recordedEndDate || (!employee.isActive ? employee.updatedAt : null);
    const employmentEnd = effectiveEndDate
      ? moment(effectiveEndDate).tz(TZ).endOf("day")
      : today.clone();
    const monthEnd = moment.min(month.clone().endOf("month"), today, employmentEnd);
    const joiningDate = employee.joiningDate
      ? moment(employee.joiningDate).tz(TZ).startOf("day")
      : monthStart.clone();
    const rangeStart = moment.max(monthStart, joiningDate);

    if (rangeStart.isAfter(monthEnd, "day")) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        meta: { month: requestedMonth },
      });
    }

    const startKey = rangeStart.format("YYYY-MM-DD");
    const endKey = monthEnd.format("YYYY-MM-DD");
    const rangeStartDate = rangeStart.clone().startOf("day").toDate();
    const rangeEndDate = monthEnd.clone().endOf("day").toDate();

    const [attendance, approvedLeaves, holidays] = await Promise.all([
      Attendance.find({
        employee: employeeId,
        attendanceDate: { $gte: startKey, $lte: endKey },
      }).populate("breakLogs"),
      Leave.find({
        employee: employeeId,
        status: "Approved",
        startDate: { $lte: rangeEndDate },
        endDate: { $gte: rangeStartDate },
      }).select("startDate endDate leaveType"),
      Holiday.find({ date: { $gte: startKey, $lte: endKey } }).select("date name"),
    ]);

    const attendanceByDate = new Map(attendance.map((record) => [record.attendanceDate, record]));
    const holidayByDate = new Map(holidays.map((holiday) => [holiday.date, holiday]));
    const timeline = [];

    for (const day = rangeStart.clone(); day.isSameOrBefore(monthEnd, "day"); day.add(1, "day")) {
      const dateKey = day.format("YYYY-MM-DD");
      const record = attendanceByDate.get(dateKey);

      if (!record) {
        const approvedLeave = approvedLeaves.find((leave) =>
          day.isBetween(
            moment(leave.startDate).tz(TZ).startOf("day"),
            moment(leave.endDate).tz(TZ).endOf("day"),
            "day",
            "[]"
          )
        );
        const holiday = holidayByDate.get(dateKey);
        const isWeekend = [0, 6].includes(day.day());
        const status = approvedLeave ? "Leave" : holiday ? "Holiday" : isWeekend ? "Weekend" : "Absent";

        timeline.push({
          _id: `calendar-${dateKey}`,
          attendanceDate: dateKey,
          date: dateKey,
          dayName: day.format("dddd"),
          status,
          checkIn: null,
          checkOut: null,
          totalHours: 0,
          productiveHours: 0,
          lateArrival: false,
          earlyLogout: false,
          attendanceSource: "Calendar",
          remarks: approvedLeave?.leaveType || holiday?.name || "",
          isSynthetic: true,
        });
        continue;
      }

      const totalBreakMinutes = (record.breakLogs || []).reduce((sum, b) => {
        if (b.duration) return sum + b.duration;
        if (b.status === "Active" && b.breakStart) {
          return sum + moment().tz(TZ).diff(moment(b.breakStart), "minutes");
        }
        return sum;
      }, 0);
      const liveHours = getLiveAttendanceHours(record, totalBreakMinutes);

      timeline.push({
        ...record.toObject(),
        totalHours: liveHours.totalHours,
        productiveHours: liveHours.productiveHours,
      });
    }

    timeline.sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));

    return res.status(200).json({
      success: true,
      count: timeline.length,
      data: timeline,
      meta: { month: requestedMonth, from: startKey, to: endKey },
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN NOTIFICATION COUNTS
// ==========================================
exports.getAdminNotificationCounts = async (_req, res) => {
  try {
    const startOfToday = moment().tz(TZ).startOf("day").toDate();
    const [pendingLeaves, pendingAttendanceCorrections, pendingResignations, overdueOffboarding] = await Promise.all([
      Leave.countDocuments({ status: "Pending" }),
      AttendanceCorrection.countDocuments({ status: "Pending" }),
      User.countDocuments({
        accountType: "Employee",
        "resignation.status": { $in: ["Submitted", "Withdrawal Requested"] },
      }),
      User.countDocuments({
        accountType: "Employee",
        isActive: true,
        "resignation.status": "Approved",
        "resignation.lastWorkingDay": { $lt: startOfToday },
        $or: [
          { "resignation.knowledgeTransferCompleted": { $ne: true } },
          { "resignation.assetsReturned": { $ne: true } },
        ],
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pendingLeaves,
        pendingAttendanceCorrections,
        pendingResignations,
        overdueOffboarding,
        total: pendingLeaves + pendingAttendanceCorrections + pendingResignations + overdueOffboarding,
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
// ADMIN: SINGLE EMPLOYEE DAY DETAIL
// ==========================================
exports.getEmployeeDayDetail = async (req, res) => {
  try {
    const { employeeId, date } = req.params;

    if (!moment.tz(date, "YYYY-MM-DD", true, TZ).isValid()) {
      return res.status(400).json({ success: false, message: "Date must use YYYY-MM-DD format" });
    }

    const employee = await User.findById(employeeId)
      .select("firstName lastName email employeeId department designation image joiningDate");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    let attendance = await Attendance.findOne({
      employee: employeeId,
      attendanceDate: date,
    });

    if (!attendance) {
      const day = moment.tz(date, "YYYY-MM-DD", TZ);
      const [approvedLeave, holiday] = await Promise.all([
        Leave.findOne({
          employee: employeeId,
          status: "Approved",
          startDate: { $lte: day.clone().endOf("day").toDate() },
          endDate: { $gte: day.clone().startOf("day").toDate() },
        }).select("leaveType"),
        Holiday.findOne({ date }).select("name"),
      ]);
      const status = approvedLeave
        ? "Leave"
        : holiday
        ? "Holiday"
        : [0, 6].includes(day.day())
        ? "Weekend"
        : "Absent";

      attendance = {
        attendanceDate: date,
        date,
        status,
        checkIn: null,
        checkOut: null,
        totalHours: 0,
        productiveHours: 0,
        lateArrival: false,
        earlyLogout: false,
        attendanceSource: "Calendar",
        remarks: approvedLeave?.leaveType || holiday?.name || "",
        isSynthetic: true,
      };
    }

    const breaks = attendance._id
      ? await BreakLog.find({ attendance: attendance._id }).sort({ breakStart: 1 })
      : [];

    const totalBreakMinutes = breaks.reduce((sum, item) => {
      if (item.duration) return sum + item.duration;
      if (item.status === "Active" && item.breakStart) {
        return sum + moment().tz(TZ).diff(moment(item.breakStart), "minutes");
      }
      return sum;
    }, 0);

    const liveHours = getLiveAttendanceHours(attendance, totalBreakMinutes);
    const attendanceData = attendance.toObject ? attendance.toObject() : attendance;

    return res.status(200).json({
      success: true,
      data: {
        employee,
        attendance: {
          ...attendanceData,
          totalHours: liveHours.totalHours,
          productiveHours: liveHours.productiveHours,
        },
        breaks,
        totalBreakMinutes,
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
// EMPLOYEE: MY SINGLE DAY DETAIL
// ==========================================
exports.getMyDayDetail = async (req, res) => {
  req.params.employeeId = req.user.id;
  return exports.getEmployeeDayDetail(req, res);
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

    let attendanceData = attendance;
    if (attendance) {
      const totalBreakMinutes = breaks.reduce((sum, b) => {
        if (b.duration) return sum + b.duration;
        if (b.status === "Active" && b.breakStart) {
          return sum + moment().tz(TZ).diff(moment(b.breakStart), "minutes");
        }
        return sum;
      }, 0);
      const liveHours = getLiveAttendanceHours(attendance, totalBreakMinutes);
      attendanceData = {
        ...attendance.toObject(),
        totalHours: liveHours.totalHours,
        productiveHours: liveHours.productiveHours,
      };
    }

    return res.status(200).json({
      success: true,
      data: { employee, attendance: attendanceData, activeBreak, breaks },
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

    let attendanceData = attendance;
    if (attendance) {
      const totalBreakMinutes = breaks.reduce((sum, b) => {
        if (b.duration) return sum + b.duration;
        if (b.status === "Active" && b.breakStart) {
          return sum + moment().tz(TZ).diff(moment(b.breakStart), "minutes");
        }
        return sum;
      }, 0);
      const liveHours = getLiveAttendanceHours(attendance, totalBreakMinutes);
      attendanceData = {
        ...attendance.toObject(),
        totalHours: liveHours.totalHours,
        productiveHours: liveHours.productiveHours,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        employee,
        attendance: attendanceData,
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
