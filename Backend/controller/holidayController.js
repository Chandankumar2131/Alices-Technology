const moment = require("moment-timezone");
const Holiday = require("../model/Holiday");
const { TZ } = require("../utils/attendanceShift");

const normalizeHolidayDate = (value) => {
  const date = moment.tz(String(value || "").trim(), "YYYY-MM-DD", true, TZ);
  return date.isValid() ? date.format("YYYY-MM-DD") : null;
};

exports.createHoliday = async (req, res) => {
  try {
    const { name, date, description } = req.body;
    const holidayDate = normalizeHolidayDate(date);

    if (!name || !holidayDate) {
      return res.status(400).json({
        success: false,
        message: "Holiday name and valid date are required",
      });
    }

    const holiday = await Holiday.create({
      name,
      date: holidayDate,
      description,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Holiday added successfully",
      data: holiday,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Holiday already exists for this date",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getHolidays = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};

    if (month && year) {
      const monthStart = moment.tz(
        `${year}-${String(month).padStart(2, "0")}-01`,
        "YYYY-MM-DD",
        TZ
      );
      filter.date = {
        $gte: monthStart.format("YYYY-MM-DD"),
        $lte: monthStart.clone().endOf("month").format("YYYY-MM-DD"),
      };
    }

    const holidays = await Holiday.find(filter).sort({ date: 1 });

    return res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
      data: holiday,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
