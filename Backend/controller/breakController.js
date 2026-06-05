const Attendance = require("../model/Attendance");
const BreakLog = require("../model/BreakLog");
const moment = require("moment");

exports.startBreak = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { reason } = req.body;

    const todayStart = moment()
      .startOf("day")
      .toDate();

    const todayEnd = moment()
      .endOf("day")
      .toDate();

    const attendance =
      await Attendance.findOne({
        employee: employeeId,
        date: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message:
          "Please check in first",
      });
    }

    const activeBreak =
      await BreakLog.findOne({
        employee: employeeId,
        status: "Active",
      });

    if (activeBreak) {
      return res.status(400).json({
        success: false,
        message:
          "You already have an active break",
      });
    }

    const breakLog =
      await BreakLog.create({
        attendance: attendance._id,
        employee: employeeId,
        breakStart: new Date(),
        reason,
      });

    attendance.breakLogs.push(
      breakLog._id
    );

    await attendance.save();

    return res.status(201).json({
      success: true,
      message:
        "Break started successfully",
      data: breakLog,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.endBreak = async (req, res) => {
  try {

    const employeeId =
      req.user.id;

    const activeBreak =
      await BreakLog.findOne({
        employee: employeeId,
        status: "Active",
      });

    if (!activeBreak) {
      return res.status(404).json({
        success: false,
        message:
          "No active break found",
      });
    }

    activeBreak.breakEnd =
      new Date();

    const duration =
      (
        activeBreak.breakEnd -
        activeBreak.breakStart
      ) /
      (1000 * 60);

    activeBreak.duration =
      Number(
        duration.toFixed(2)
      );

    activeBreak.status =
      "Completed";

    await activeBreak.save();

    const attendance =
      await Attendance.findById(
        activeBreak.attendance
      );

    attendance.breakHours =
      Number(
        (
          attendance.breakHours +
          duration / 60
        ).toFixed(2)
      );

    await attendance.save();

    return res.status(200).json({
      success: true,
      message:
        "Break ended successfully",
      data: activeBreak,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyBreaks = async (req, res) => {
    try {

      const breaks =
        await BreakLog.find({
          employee:
            req.user.id,
        })
          .populate(
            "attendance"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        count: breaks.length,
        data: breaks,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

  exports.getTodayBreaks =  async (req, res) => {
    try {

      const todayStart =
        moment()
          .startOf("day")
          .toDate();

      const todayEnd =
        moment()
          .endOf("day")
          .toDate();

      const breaks =
        await BreakLog.find({
          employee:
            req.user.id,
          createdAt: {
            $gte:
              todayStart,
            $lte:
              todayEnd,
          },
        });

      return res.status(200).json({
        success: true,
        count: breaks.length,
        data: breaks,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };