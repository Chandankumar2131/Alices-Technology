const Attendance = require("../model/Attendance");
const BreakLog = require("../model/BreakLog");
const moment = require("moment-timezone");

const TZ = "Asia/Kolkata";
const CHECK_IN_START = { hour: 19, minute: 0 };
const CHECK_IN_END = { hour: 19, minute: 30 };
const CHECK_OUT_TIME = { hour: 4, minute: 0 };

const getShiftDate = (time = moment().tz(TZ)) => {
  const localTime = moment(time).tz(TZ);
  return localTime.hour() < 12
    ? localTime.clone().subtract(1, "day").format("YYYY-MM-DD")
    : localTime.format("YYYY-MM-DD");
};

const getShiftBoundary = (shiftDate, boundary) =>
  moment.tz(
    `${shiftDate} ${String(boundary.hour).padStart(2, "0")}:${String(
      boundary.minute
    ).padStart(2, "0")}`,
    "YYYY-MM-DD HH:mm",
    TZ
  );

// ==========================================
// CHECK IN
// ==========================================
exports.checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const nowMoment = moment().tz(TZ);
    const now = nowMoment.toDate();
    const attendanceDate = getShiftDate(nowMoment);

    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      attendanceDate,
    });

    // Prevent check-in if leave approved
    if (existingAttendance && existingAttendance.status === "Leave") {
      return res.status(400).json({
        success: false,
        message: "You are on approved leave today",
      });
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

    const totalHours = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);
    attendance.totalHours = Number(totalHours.toFixed(2));

    attendance.productiveHours = Number(
      (attendance.totalHours - attendance.breakHours).toFixed(2)
    );
    if (attendance.productiveHours < 0) {
      attendance.productiveHours = 0;
    }

    attendance.overtimeHours =
      attendance.productiveHours > 8
        ? Number((attendance.productiveHours - 8).toFixed(2))
        : 0;

    const checkoutTime = getShiftBoundary(attendanceDate, CHECK_OUT_TIME).add(1, "day");
    attendance.earlyLogout = nowMoment.isBefore(checkoutTime);

    await attendance.save();

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

    const attendance = await Attendance.find({
      employee: employeeId,
    }).sort({ date: -1 });

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

    const startDate = moment(
      `${year}-${month}-01`,
      "YYYY-MM-DD"
    )
      .startOf("month")
      .toDate();

    const endDate = moment(
      `${year}-${month}-01`,
      "YYYY-MM-DD"
    )
      .endOf("month")
      .toDate();

    const attendanceRecords =
      await Attendance.find({
        employee: employeeId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      }).sort({ date: 1 });

    const attendanceMap = {};

    attendanceRecords.forEach(
      (record) => {
        attendanceMap[
          moment(record.date).format(
            "YYYY-MM-DD"
          )
        ] = record;
      }
    );

    const calendar = [];

    let current =
      moment(startDate);

    while (
      current.isSameOrBefore(
        endDate,
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

      const record =
        attendanceMap[
          dateKey
        ];

      if (record) {
        calendar.push({
          _id: record._id,

          date: record.date,

          dayName,

          status:
            record.status,

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
        });
      } else {
        calendar.push({
          date:
            current.toDate(),

          dayName,

          status:
            isWeekend
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
      absentDays: 0,
      leaveDays: 0,
      weekendDays: 0,
      lateDays: 0,
      totalHours: 0,
      productiveHours: 0,
      overtimeHours: 0,
    };

    attendance.forEach((record) => {
      if (record.status === "Present") summary.presentDays++;
      if (record.status === "Absent") summary.absentDays++;
      if (record.status === "Leave") summary.leaveDays++;
      if (record.status === "Weekend") summary.weekendDays++;
      if (record.lateArrival) summary.lateDays++;

      summary.totalHours += record.totalHours || 0;
      summary.productiveHours += record.productiveHours || 0;
      summary.overtimeHours += record.overtimeHours || 0;
    });

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
    const attendance = await Attendance.find()
      .populate(
        "employee",
        "firstName lastName email employeeId department designation"
      )
      .sort({ date: -1 });

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
// ADMIN - EMPLOYEE ATTENDANCE
// ==========================================
exports.getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const attendance = await Attendance.find({ employee: employeeId })
      .populate(
        "employee",
        "firstName lastName email employeeId department designation"
      )
      .sort({ date: -1 });

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
