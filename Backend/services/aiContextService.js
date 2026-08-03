const moment = require("moment-timezone");
const mongoose = require("mongoose");
const Attendance = require("../model/Attendance");
const Candidate = require("../model/Candidate");
const Leave = require("../model/Leave");
const LeaveBalance = require("../model/LeaveBalance");
const User = require("../model/User");
const { TZ, getShiftDate } = require("../utils/attendanceShift");

const employeeContext = async (userId) => {
  const employeeObjectId = new mongoose.Types.ObjectId(userId);
  const today = getShiftDate();
  const monthStart = moment.tz(TZ).startOf("month").format("YYYY-MM-DD");
  const monthEnd = moment.tz(TZ).endOf("month").format("YYYY-MM-DD");

  const [user, attendance, leaveCounts, leaveBalance] = await Promise.all([
    User.findById(userId).select(
      "firstName lastName employeeId department designation joiningDate"
    ).lean(),
    Attendance.find({
      employee: userId,
      attendanceDate: { $gte: monthStart, $lte: monthEnd },
    })
      .select("attendanceDate status totalHours productiveHours lateArrival")
      .sort({ attendanceDate: -1 })
      .lean(),
    Leave.aggregate([
      { $match: { employee: employeeObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    LeaveBalance.findOne({ employee: userId })
      .select(
        "casualAvailable sickAvailable carryForwardAvailable unpaidLeaveDays"
      )
      .lean(),
  ]);

  const statusCounts = attendance.reduce((result, record) => {
    result[record.status] = (result[record.status] || 0) + 1;
    return result;
  }, {});

  return {
    scope: "The signed-in employee's own records only",
    today,
    employee: user,
    currentMonthAttendance: {
      from: monthStart,
      to: monthEnd,
      statusCounts,
      lateArrivals: attendance.filter((item) => item.lateArrival).length,
      totalHours: Number(
        attendance.reduce((sum, item) => sum + (item.totalHours || 0), 0).toFixed(2)
      ),
      recentRecords: attendance.slice(0, 10),
    },
    leaveRequests: Object.fromEntries(
      leaveCounts.map((item) => [item._id, item.count])
    ),
    leaveBalance,
  };
};

const adminContext = async () => {
  const today = getShiftDate();
  const monthStart = moment.tz(TZ).startOf("month").format("YYYY-MM-DD");
  const monthEnd = moment.tz(TZ).endOf("month").format("YYYY-MM-DD");

  const [employees, todayAttendance, monthAttendance, leaveCounts, candidates] =
    await Promise.all([
      User.find({ accountType: "Employee", isActive: true })
        .select("firstName lastName employeeId department designation")
        .lean(),
      Attendance.find({ attendanceDate: today })
        .select("employee status lateArrival")
        .lean(),
      Attendance.find({
        attendanceDate: { $gte: monthStart, $lte: monthEnd },
      })
        .select("status lateArrival productiveHours")
        .lean(),
      Leave.aggregate([
        { $match: { status: { $in: ["Pending", "Approved", "Rejected"] } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Candidate.aggregate([
        {
          $group: {
            _id: "$subscriptionStatus",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  const presentIds = new Set(
    todayAttendance
      .filter((item) => ["Present", "Half Day"].includes(item.status))
      .map((item) => String(item.employee))
  );

  const departmentCounts = employees.reduce((result, employee) => {
    const department = employee.department || "Unassigned";
    result[department] = (result[department] || 0) + 1;
    return result;
  }, {});

  return {
    scope: "Organization summary available to Admin and SuperAdmin",
    today,
    workforce: {
      activeEmployees: employees.length,
      departments: departmentCounts,
      presentToday: presentIds.size,
      lateToday: todayAttendance.filter((item) => item.lateArrival).length,
      currentMonth: {
        from: monthStart,
        to: monthEnd,
        lateArrivals: monthAttendance.filter((item) => item.lateArrival).length,
        productiveHours: Number(
          monthAttendance
            .reduce((sum, item) => sum + (item.productiveHours || 0), 0)
            .toFixed(2)
        ),
      },
    },
    leaveRequests: Object.fromEntries(
      leaveCounts.map((item) => [item._id, item.count])
    ),
    candidates: Object.fromEntries(
      candidates.map((item) => [item._id, item.count])
    ),
  };
};

exports.buildAssistantContext = async (user) => {
  if (["Admin", "SuperAdmin"].includes(user.accountType)) {
    return adminContext();
  }
  return employeeContext(user.id);
};
