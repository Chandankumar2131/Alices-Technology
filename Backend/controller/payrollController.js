const Payroll = require("../model/Payroll");
const Attendance = require("../model/Attendance");
const SalaryStructure = require("../model/SalaryStructure");
const User = require("../model/User");

// ==========================================
// GENERATE PAYROLL
// ADMIN
// ==========================================
exports.generatePayroll = async (req, res) => {
  try {

    const {
      employeeId,
      month,
      year,
    } = req.body;

    if (
      !employeeId ||
      !month ||
      !year
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee, month and year are required",
      });
    }

    const employee =
      await User.findById(
        employeeId
      );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found",
      });
    }

    const existingPayroll =
      await Payroll.findOne({
        employee: employeeId,
        month,
        year,
      });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message:
          "Payroll already generated",
      });
    }

    const salaryStructure =
      await SalaryStructure.findOne({
        employee: employeeId,
      });

    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message:
          "Salary structure not found",
      });
    }

    const startDate = new Date(
      year,
      month - 1,
      1
    );

    const endDate = new Date(
      year,
      month,
      0,
      23,
      59,
      59
    );

    const attendance =
      await Attendance.find({
        employee: employeeId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      });

    let presentDays = 0;
    let leaveDays = 0;
    let absentDays = 0;
    let overtimeHours = 0;

    attendance.forEach(
      (record) => {

        if (
          record.status ===
          "Present"
        ) {
          presentDays++;
        }

        if (
          record.status ===
          "Leave"
        ) {
          leaveDays++;
        }

        if (
          record.status ===
          "Absent"
        ) {
          absentDays++;
        }

        overtimeHours +=
          record.overtimeHours || 0;
      }
    );

    const daysInMonth =
      new Date(
        year,
        month,
        0
      ).getDate();

    let workingDays = 0;

    for (
      let i = 1;
      i <= daysInMonth;
      i++
    ) {

      const day =
        new Date(
          year,
          month - 1,
          i
        ).getDay();

      if (
        day !== 0 &&
        day !== 6
      ) {
        workingDays++;
      }
    }

    absentDays =
      workingDays -
      presentDays -
      leaveDays;

    if (absentDays < 0) {
      absentDays = 0;
    }

    const perDaySalary =
      salaryStructure.netSalary /
      workingDays;

    const absentDeduction =
      perDaySalary *
      absentDays;

    const finalSalary =
      salaryStructure.netSalary -
      absentDeduction;

    const payroll =
      await Payroll.create({
        employee: employeeId,

        salaryStructure:
          salaryStructure._id,

        month,

        year,

        workingDays,

        presentDays,

        leaveDays,

        absentDays,

        overtimeHours,

        grossSalary:
          salaryStructure.grossSalary,

        deductions:
          absentDeduction,

        netSalary:
          Number(
            finalSalary.toFixed(2)
          ),
      });

    return res.status(201).json({
      success: true,
      message:
        "Payroll generated successfully",
      data: payroll,
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
// GET MY PAYROLL
// EMPLOYEE
// ==========================================
exports.getMyPayroll =
  async (req, res) => {
    try {

      const payroll =
        await Payroll.find({
          employee:
            req.user.id,
        })
          .populate(
            "salaryStructure"
          )
          .sort({
            year: -1,
            month: -1,
          });

      return res.status(200).json({
        success: true,
        count:
          payroll.length,
        data: payroll,
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
// GET EMPLOYEE PAYROLL
// ADMIN
// ==========================================
exports.getEmployeePayroll =
  async (req, res) => {
    try {

      const {
        employeeId,
      } = req.params;

      const payroll =
        await Payroll.find({
          employee:
            employeeId,
        })
          .populate(
            "employee",
            "firstName lastName email employeeId"
          )
          .populate(
            "salaryStructure"
          )
          .sort({
            year: -1,
            month: -1,
          });

      return res.status(200).json({
        success: true,
        count:
          payroll.length,
        data: payroll,
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
// GET ALL PAYROLLS
// ADMIN
// ==========================================
exports.getAllPayrolls =
  async (req, res) => {
    try {

      const payrolls =
        await Payroll.find()
          .populate(
            "employee",
            "firstName lastName email employeeId department designation"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        count:
          payrolls.length,
        data: payrolls,
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
// MARK AS PAID
// ADMIN
// ==========================================
exports.markPayrollPaid =
  async (req, res) => {
    try {

      const {
        payrollId,
      } = req.params;

      const payroll =
        await Payroll.findById(
          payrollId
        );

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message:
            "Payroll not found",
        });
      }

      payroll.paymentStatus =
        "Paid";

      payroll.paidAt =
        new Date();

      await payroll.save();

      return res.status(200).json({
        success: true,
        message:
          "Payroll marked as paid",
        data: payroll,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };