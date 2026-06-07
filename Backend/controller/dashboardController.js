const User = require("../model/User");
const Attendance = require("../model/Attendance");
const Leave = require("../model/Leave");
const Payroll = require("../model/Payroll");
const BreakLog = require("../model/BreakLog");
const moment = require("moment");

// ==========================================
// ADMIN DASHBOARD
// ==========================================
exports.getAdminDashboard = async (req, res) => {
  try {

    const today =
      moment().format("YYYY-MM-DD");

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
exports.getLiveEmployees = async (req, res) => {
  try {

    const today =
      moment().format("YYYY-MM-DD");

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

            const activeBreak =
              await BreakLog.findOne({
                attendance:
                  record._id,
                status:
                  "Active",
              });

            let status =
              "Working";

            if (
              record.checkOut
            ) {
              status =
                "Checked Out";
            }

            if (
              activeBreak
            ) {
              status =
                "On Break";
            }

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
exports.getEmployeeDashboard =
  async (req, res) => {
    try {

      const {
        employeeId,
      } = req.params;

      const employee =
        await User.findById(
          employeeId
        ).select("-password");

      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      const attendance =
        await Attendance.find({
          employee:
            employeeId,
        }).sort({
          date: -1,
        });

      const leaves =
        await Leave.find({
          employee:
            employeeId,
        }).sort({
          createdAt: -1,
        });

      const payrolls =
        await Payroll.find({
          employee:
            employeeId,
        }).sort({
          year: -1,
          month: -1,
        });

      return res.status(200).json({
        success: true,
        data: {
          employee,
          attendance,
          leaves,
          payrolls,
        },
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