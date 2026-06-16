const Attendance = require("../model/Attendance");
const BreakLog = require("../model/BreakLog");
const { getShiftDate } = require("../utils/attendanceShift");

// ==========================================
// START BREAK
// ==========================================
exports.startBreak = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const { reason } = req.body;

    const attendanceDate = getShiftDate();

    // Find today's attendance
    const attendance = await Attendance.findOne({
      employee: employeeId,
      attendanceDate,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: "Please check in first",
      });
    }

    // Prevent break after checkout
    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: "You have already checked out",
      });
    }

    // Check active break
    const activeBreak = await BreakLog.findOne({
      employee: employeeId,
      status: "Active",
    });

    if (activeBreak) {
      return res.status(400).json({
        success: false,
        message: "You already have an active break",
      });
    }

    const breakLog = await BreakLog.create({
      attendance: attendance._id,
      employee: employeeId,
      breakStart: new Date(),
      reason,
    });

    attendance.breakLogs.push(breakLog._id);

    await attendance.save();

    return res.status(201).json({
      success: true,
      message: "Break started successfully",
      data: breakLog,
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
// END BREAK
// ==========================================
exports.endBreak = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const activeBreak = await BreakLog.findOne({
      employee: employeeId,
      status: "Active",
    });

    if (!activeBreak) {
      return res.status(404).json({
        success: false,
        message: "No active break found",
      });
    }

    activeBreak.breakEnd = new Date();

    const duration =
      (activeBreak.breakEnd - activeBreak.breakStart) /
      (1000 * 60);

    activeBreak.duration = Number(
      duration.toFixed(2)
    );

    activeBreak.status = "Completed";

    await activeBreak.save();

    const attendance = await Attendance.findById(
      activeBreak.attendance
    );

    attendance.breakHours = Number(
      (
        attendance.breakHours +
        duration / 60
      ).toFixed(2)
    );

    attendance.productiveHours = Number(
      (
        attendance.totalHours -
        attendance.breakHours
      ).toFixed(2)
    );

    if (attendance.productiveHours < 0) {
      attendance.productiveHours = 0;
    }

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Break ended successfully",
      data: activeBreak,
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
// GET MY BREAKS
// ==========================================
exports.getMyBreaks = async (req, res) => {
  try {
    const breaks = await BreakLog.find({
      employee: req.user.id,
    })
      .populate("attendance")
      .sort({
        breakStart: -1,
      });

    return res.status(200).json({
      success: true,
      count: breaks.length,
      data: breaks,
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
// GET TODAY'S BREAKS
// ==========================================
exports.getTodayBreaks = async (req, res) => {
  try {
    const attendanceDate = getShiftDate();

    const attendance = await Attendance.findOne({
      employee: req.user.id,
      attendanceDate,
    });

    if (!attendance) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const breaks = await BreakLog.find({
      attendance: attendance._id,
    }).sort({
      breakStart: -1,
    });

    return res.status(200).json({
      success: true,
      count: breaks.length,
      data: breaks,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
