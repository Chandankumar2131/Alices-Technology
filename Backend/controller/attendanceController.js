const Attendance = require("../model/Attendance");
const BreakLog = require("../model/BreakLog");
const AttendanceCorrection = require("../model/AttendanceCorrection");
const Holiday = require("../model/Holiday");
const Leave = require("../model/Leave");
const moment = require("moment-timezone");
const {
  TZ,
  CHECK_IN_START,
  CHECK_IN_END,
  CHECK_OUT_TIME,
  getShiftDate,
  getShiftBoundary,
} = require("../utils/attendanceShift");
const {
  autoCheckoutOpenAttendances,
  calculateAttendanceTotals,
  getCalculatedAttendanceStatus,
} = require("../utils/autoCheckout");
const { getPagination, paginatedResponse } = require("../utils/pagination");
const { emitAttendanceUpdate } = require("../utils/attendanceEvents");

const emitAdminNotifications = (req) => {
  req.app?.get("io")?.to("role:admin").emit("admin:notifications", {
    type: "attendance-correction",
    at: new Date().toISOString(),
  });
};

const parseOfficeDateTime = (value) => {
  const text = String(value || "").trim();
  const dateTimeOnly = text.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/);

  if (dateTimeOnly) {
    return moment.tz(
      `${dateTimeOnly[1]} ${dateTimeOnly[2]}:${dateTimeOnly[3] || "00"}`,
      "YYYY-MM-DD HH:mm:ss",
      TZ
    );
  }

  return moment.tz(text, TZ);
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
// CHECK IN
// ==========================================
exports.checkIn = async (req, res) => {
  try {
    await autoCheckoutOpenAttendances();

    const employeeId = req.user.id;
    const nowMoment = moment().tz(TZ);
    const now = nowMoment.toDate();
    const attendanceDate = getShiftDate(nowMoment);

    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      attendanceDate,
    });

    if (existingAttendance && existingAttendance.status === "Leave") {
      const approvedLeaveExists = await hasApprovedLeaveForDate(employeeId, attendanceDate);

      if (approvedLeaveExists && !existingAttendance.checkIn) {
        return res.status(400).json({
          success: false,
          message: "You are on approved leave today",
        });
      }

      if (!approvedLeaveExists) {
        existingAttendance.status = "Present";
        existingAttendance.remarks = existingAttendance.remarks
          ? `${existingAttendance.remarks} | Leave cleared on check-in`
          : "Leave cleared on check-in";
      }
    }

    // Prevent duplicate check-in
    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: "You have already checked in today",
      });
    }

    const dayName = nowMoment.format("dddd");
    const isWeekend = dayName === "Saturday" || dayName === "Sunday";

    // Block weekend check-in
    if (isWeekend) {
      return res.status(400).json({
        success: false,
        message: "Check-in is not allowed on weekends",
      });
    }

    const checkInStart = getShiftBoundary(attendanceDate, CHECK_IN_START);
    const checkInEnd = getShiftBoundary(attendanceDate, CHECK_IN_END);

    if (nowMoment.isBefore(checkInStart)) {
      return res.status(400).json({
        success: false,
        message: "Check-in is allowed from 07:00 PM",
      });
    }

    const lateArrival = nowMoment.isAfter(checkInEnd);

    let attendance;
    if (existingAttendance) {
      existingAttendance.checkIn = now;
      existingAttendance.status = "Present";
      existingAttendance.lateArrival = lateArrival;
      existingAttendance.attendanceSource = "Web";
      await existingAttendance.save();
      attendance = existingAttendance;
    } else {
      attendance = await Attendance.create({
        employee: employeeId,
        attendanceDate,
        date: now,
        dayName,
        isWeekend,
        checkIn: now,
        lateArrival,
        attendanceSource: "Web",
        status: "Present",
      });
    }

    emitAttendanceUpdate(req, {
      type: "check-in",
      employeeId,
      attendanceId: attendance._id,
      attendanceDate,
    });

    return res.status(201).json({
      success: true,
      message: "Check In successful",
      data: {
        ...attendance.toObject(),
        checkInTime: moment(attendance.checkIn).tz(TZ).format("hh:mm A"),
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
// CHECK OUT
// ==========================================
exports.checkOut = async (req, res) => {
  try {
    await autoCheckoutOpenAttendances();

    const employeeId = req.user.id;
    const nowMoment = moment().tz(TZ);
    const now = nowMoment.toDate();
    const attendanceDate = getShiftDate(nowMoment);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      attendanceDate,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No attendance found for this shift",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: "Already checked out",
      });
    }

    const activeBreaks = await BreakLog.find({
      employee: employeeId,
      attendance: attendance._id,
      status: "Active",
    });

    for (const activeBreak of activeBreaks) {
      activeBreak.breakEnd = now;
      activeBreak.duration = Number(
        ((activeBreak.breakEnd - activeBreak.breakStart) / (1000 * 60)).toFixed(2)
      );
      activeBreak.status = "Completed";
      await activeBreak.save();

      attendance.breakHours = Number(
        (attendance.breakHours + activeBreak.duration / 60).toFixed(2)
      );
    }

    attendance.checkOut = now;

    calculateAttendanceTotals(attendance);

    const checkoutTime = getShiftBoundary(attendanceDate, CHECK_OUT_TIME).add(1, "day");
    attendance.earlyLogout = nowMoment.isBefore(checkoutTime);

    await attendance.save();

    emitAttendanceUpdate(req, {
      type: "check-out",
      employeeId,
      attendanceId: attendance._id,
      attendanceDate,
    });

    return res.status(200).json({
      success: true,
      message: "Check Out successful",
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
// GET MY ATTENDANCE
// ==========================================
exports.getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { page, limit, skip } = getPagination(req.query);
    const filter = {
      employee: employeeId,
    };

    const attendance = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(filter);

    return res.status(200).json({
      success: true,
      ...paginatedResponse({ page, limit, total, data: attendance }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ATTENDANCE BY MONTH
// ==========================================
exports.getAttendanceByMonth = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message:
          "Month and year parameters are required",
      });
    }

    const monthStart = moment.tz(
      `${year}-${String(month).padStart(2, "0")}-01`,
      "YYYY-MM-DD",
      TZ
    );

    const monthEnd = monthStart.clone().endOf("month");

    const startDateKey = monthStart.format("YYYY-MM-DD");
    const endDateKey = monthEnd.format("YYYY-MM-DD");

    const attendanceRecords =
      await Attendance.find({
        employee: employeeId,
        attendanceDate: {
          $gte: startDateKey,
          $lte: endDateKey,
        },
      }).sort({ attendanceDate: 1 });

    const holidayRecords = await Holiday.find({
      date: {
        $gte: startDateKey,
        $lte: endDateKey,
      },
    });

    const attendanceMap = {};
    const holidayMap = {};

    attendanceRecords.forEach(
      (record) => {
        attendanceMap[record.attendanceDate] = record;
      }
    );

    holidayRecords.forEach((holiday) => {
      holidayMap[holiday.date] = holiday;
    });

    const calendar = [];

    let current =
      monthStart.clone();

    while (
      current.isSameOrBefore(
        monthEnd,
        "day"
      )
    ) {
      const dateKey =
        current.format(
          "YYYY-MM-DD"
        );

      const dayName =
        current.format(
          "dddd"
        );

      const isWeekend =
        dayName ===
          "Saturday" ||
        dayName ===
          "Sunday";

      const holiday = holidayMap[dateKey];

      let record =
        attendanceMap[
          dateKey
        ];

      if (record) {
        record = await reconcileLeaveAttendance(record);
      }

      if (
        holiday &&
        record &&
        !record.checkIn &&
        ["Absent", "Leave"].includes(record.status)
      ) {
        record.status = "Holiday";
        record.remarks = record.remarks
          ? `${record.remarks} | Holiday override`
          : "Holiday override";
        await record.save();
      }

      if (record) {
        calendar.push({
          _id: record._id,

          date: record.attendanceDate,

          attendanceDate: record.attendanceDate,

          dayName,

          status:
            holiday && record.status === "Holiday" ? "Holiday" : record.status,

          checkIn:
            record.checkIn,

          checkOut:
            record.checkOut,

          totalHours:
            record.totalHours,

          productiveHours:
            record.productiveHours,

          overtimeHours:
            record.overtimeHours,

          lateArrival:
            record.lateArrival,

          earlyLogout:
            record.earlyLogout,

          remarks:
            record.remarks,

          holidayName:
            holiday?.name || "",
        });
      } else {
        calendar.push({
          date:
            dateKey,

          attendanceDate: dateKey,

          dayName,

          status:
            holiday
              ? "Holiday"
              : isWeekend
              ? "Weekend"
              : "Absent",

          checkIn: null,

          checkOut: null,

          totalHours: 0,

          productiveHours: 0,

          overtimeHours: 0,

          lateArrival: false,

          earlyLogout: false,

          remarks: "",

          holidayName: holiday?.name || "",
        });
      }

      current.add(1, "day");
    }

    return res.status(200).json({
      success: true,
      month: Number(month),
      year: Number(year),
      totalDays:
        calendar.length,
      data: calendar,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ==========================================
// ATTENDANCE SUMMARY
// ==========================================
exports.getAttendanceSummary = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const attendance = await Attendance.find({ employee: employeeId });

    const summary = {
      presentDays: 0,
      halfDays: 0,
      absentDays: 0,
      leaveDays: 0,
      holidayDays: 0,
      weekendDays: 0,
      lateDays: 0,
      totalHours: 0,
      productiveHours: 0,
      overtimeHours: 0,
    };

    for (const item of attendance) {
      const record = await reconcileLeaveAttendance(item);

      if (!record) continue;

      if (record.status === "Present") summary.presentDays++;
      if (record.status === "Half Day") summary.halfDays++;
      if (record.status === "Absent") summary.absentDays++;
      if (record.status === "Leave") summary.leaveDays++;
      if (record.status === "Holiday") summary.holidayDays++;
      if (record.status === "Weekend") summary.weekendDays++;
      if (record.lateArrival) summary.lateDays++;

      summary.totalHours += record.totalHours || 0;
      summary.productiveHours += record.productiveHours || 0;
      summary.overtimeHours += record.overtimeHours || 0;
    }

    // Clean up totals to 2 decimals
    summary.totalHours = Number(summary.totalHours.toFixed(2));
    summary.productiveHours = Number(summary.productiveHours.toFixed(2));
    summary.overtimeHours = Number(summary.overtimeHours.toFixed(2));

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN - GET ALL ATTENDANCE
// ==========================================
exports.getAllAttendance = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const attendance = await Attendance.find()
      .populate(
        "employee",
        "firstName lastName email employeeId department designation"
      )
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments();

    return res.status(200).json({
      success: true,
      ...paginatedResponse({ page, limit, total, data: attendance }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN - EMPLOYEE ATTENDANCE
// ==========================================
exports.getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page, limit, skip } = getPagination(req.query);
    const filter = { employee: employeeId };

    const attendance = await Attendance.find(filter)
      .populate(
        "employee",
        "firstName lastName email employeeId department designation"
      )
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(filter);

    return res.status(200).json({
      success: true,
      ...paginatedResponse({ page, limit, total, data: attendance }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN - MARK HALF DAY AS PRESENT
// ==========================================
exports.markHalfDayAsPresent = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { reason } = req.body;

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    if (attendance.status !== "Half Day") {
      return res.status(400).json({
        success: false,
        message: "Only half day attendance can be marked present",
      });
    }

    attendance.systemStatus =
      attendance.systemStatus || getCalculatedAttendanceStatus(attendance);
    attendance.status = "Present";
    attendance.statusOverride = true;
    attendance.overrideBy = req.user.id;
    attendance.overrideAt = new Date();
    attendance.overrideReason = reason || "";
    attendance.remarks = attendance.remarks
      ? `${attendance.remarks} | Half day marked present by admin`
      : "Half day marked present by admin";

    await attendance.save();

    emitAttendanceUpdate(req, {
      type: "attendance-override",
      employeeId: attendance.employee,
      attendanceId: attendance._id,
      attendanceDate: attendance.attendanceDate,
    });

    return res.status(200).json({
      success: true,
      message: "Half day marked as present",
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
// REQUEST CHECK-IN CORRECTION
// ==========================================
exports.requestCheckInCorrection = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { attendanceId, requestedCheckIn, reason } = req.body;

    if (!attendanceId || !requestedCheckIn || !reason) {
      return res.status(400).json({
        success: false,
        message: "Attendance, requested check-in time and reason are required",
      });
    }

    const attendance = await Attendance.findOne({
      _id: attendanceId,
      employee: employeeId,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: "Attendance correction is not allowed after check-out",
      });
    }

    const requestedMoment = parseOfficeDateTime(requestedCheckIn);

    if (!requestedMoment.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid requested check-in time",
      });
    }

    const shiftStart = getShiftBoundary(attendance.attendanceDate, CHECK_IN_START);
    const shiftEnd = getShiftBoundary(attendance.attendanceDate, CHECK_OUT_TIME).add(1, "day");

    if (requestedMoment.isBefore(shiftStart) || requestedMoment.isAfter(shiftEnd)) {
      return res.status(400).json({
        success: false,
        message: "Requested check-in must be within the attendance shift",
      });
    }

    const correction = await AttendanceCorrection.create({
      employee: employeeId,
      attendance: attendance._id,
      currentCheckIn: attendance.checkIn,
      requestedCheckIn: requestedMoment.toDate(),
      reason,
    });

    emitAdminNotifications(req);

    emitAttendanceUpdate(req, {
      type: "correction-requested",
      employeeId,
      attendanceId: attendance._id,
      attendanceDate: attendance.attendanceDate,
    });

    return res.status(201).json({
      success: true,
      message: "Attendance correction request submitted",
      data: correction,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A pending correction request already exists for this attendance",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// MY CHECK-IN CORRECTION REQUESTS
// ==========================================
exports.getMyCorrectionRequests = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { employee: req.user.id };

    const requests = await AttendanceCorrection.find(filter)
      .populate("attendance")
      .populate("approvedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AttendanceCorrection.countDocuments(filter);

    return res.status(200).json({
      success: true,
      ...paginatedResponse({ page, limit, total, data: requests }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN - ALL CHECK-IN CORRECTION REQUESTS
// ==========================================
exports.getAllCorrectionRequests = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const requests = await AttendanceCorrection.find()
      .populate("employee", "firstName lastName email employeeId department designation")
      .populate("attendance")
      .populate("approvedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AttendanceCorrection.countDocuments();

    return res.status(200).json({
      success: true,
      ...paginatedResponse({ page, limit, total, data: requests }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN - APPROVE CHECK-IN CORRECTION
// ==========================================
exports.approveCorrectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminRemarks } = req.body;

    const correction = await AttendanceCorrection.findById(requestId);

    if (!correction) {
      return res.status(404).json({
        success: false,
        message: "Correction request not found",
      });
    }

    if (correction.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Correction request is already processed",
      });
    }

    const attendance = await Attendance.findById(correction.attendance);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    attendance.checkIn = correction.requestedCheckIn;
    attendance.lateArrival = moment(attendance.checkIn).tz(TZ).isAfter(
      getShiftBoundary(attendance.attendanceDate, CHECK_IN_END)
    );

    if (attendance.checkOut) {
      attendance.statusOverride = false;
      attendance.systemStatus = undefined;
      attendance.overrideBy = undefined;
      attendance.overrideAt = undefined;
      attendance.overrideReason = "";
      calculateAttendanceTotals(attendance);
    }

    attendance.remarks = attendance.remarks
      ? `${attendance.remarks} | Check-in corrected by admin`
      : "Check-in corrected by admin";

    correction.status = "Approved";
    correction.approvedBy = req.user.id;
    correction.approvedAt = new Date();
    correction.adminRemarks = adminRemarks || "";

    await attendance.save();
    await correction.save();
    emitAdminNotifications(req);

    emitAttendanceUpdate(req, {
      type: "correction-approved",
      employeeId: attendance.employee,
      attendanceId: attendance._id,
      attendanceDate: attendance.attendanceDate,
    });

    const updatedCorrection = await AttendanceCorrection.findById(correction._id)
      .populate("employee", "firstName lastName email employeeId department designation")
      .populate("attendance")
      .populate("approvedBy", "firstName lastName email");

    return res.status(200).json({
      success: true,
      message: "Attendance correction approved",
      data: updatedCorrection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN - REJECT CHECK-IN CORRECTION
// ==========================================
exports.rejectCorrectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminRemarks } = req.body;

    const correction = await AttendanceCorrection.findById(requestId);

    if (!correction) {
      return res.status(404).json({
        success: false,
        message: "Correction request not found",
      });
    }

    if (correction.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Correction request is already processed",
      });
    }

    correction.status = "Rejected";
    correction.approvedBy = req.user.id;
    correction.approvedAt = new Date();
    correction.adminRemarks = adminRemarks || "";
    await correction.save();
    emitAdminNotifications(req);

    emitAttendanceUpdate(req, {
      type: "correction-rejected",
      employeeId: correction.employee,
      attendanceId: correction.attendance,
    });

    const updatedCorrection = await AttendanceCorrection.findById(correction._id)
      .populate("employee", "firstName lastName email employeeId department designation")
      .populate("attendance")
      .populate("approvedBy", "firstName lastName email");

    return res.status(200).json({
      success: true,
      message: "Attendance correction rejected",
      data: updatedCorrection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
