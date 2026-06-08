const Payroll = require("../model/Payroll");
const Attendance = require("../model/Attendance");
const SalaryStructure = require("../model/SalaryStructure");
const PDFDocument = require("pdfkit");
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
exports.getMyPayroll = async (req, res) => {
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
exports.getEmployeePayroll = async (req, res) => {
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
exports.getAllPayrolls =async (req, res) => {
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
exports.markPayrollPaid =async (req, res) => {
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

// ==========================================
// DOWNLOAD PAYSLIP
// EMPLOYEE
// ==========================================

exports.downloadPayslip = async (req, res) => {
  try {
    const { payrollId } = req.params;

    const payroll = await Payroll.findById(payrollId)
      .populate("employee")
      .populate("salaryStructure");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    // ==========================================
    // ACCESS CONTROL
    // ==========================================

    const loggedInUserId = req.user.id;
    const accountType = req.user.accountType;

    if (
      accountType === "Employee" &&
      payroll.employee._id.toString() !== loggedInUserId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this payslip",
      });
    }

    const employee = payroll.employee;
    const salary = payroll.salaryStructure;

    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];
    const monthLabel = monthNames[(payroll.month - 1)] || payroll.month;

    const doc = new PDFDocument({ margin: 0, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payslip-${payroll.month}-${payroll.year}.pdf`
    );
    doc.pipe(res);

    const PAGE_W = 595;
    const PAGE_H = 842;
    const MARGIN = 40;
    const COL_W = (PAGE_W - MARGIN * 2) / 2;

    // ── Colours ──────────────────────────────────────────────
    const NAVY   = "#0C3B6E";
    const BLUE   = "#1A6DB5";
    const LGRAY  = "#F4F6FA";
    const MGRAY  = "#D1D9E6";
    const DGRAY  = "#4A5568";
    const BLACK  = "#1A202C";
    const WHITE  = "#FFFFFF";
    const GREEN  = "#276749";
    const GBG    = "#EBF8F1";

    // ── Helper: currency ─────────────────────────────────────
    const fmt = (n) =>
      "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // ── HEADER BAND ──────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 110).fill(NAVY);

    // Company name
    doc
      .fillColor(WHITE)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("ALICE TECH SOLUTIONS", MARGIN, 28, { width: PAGE_W - MARGIN * 2, align: "left" });

    // Payslip label (right-aligned in header)
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#A8C4E0")
      .text(`PAYSLIP  •  ${monthLabel.toUpperCase()} ${payroll.year}`, MARGIN, 34, {
        width: PAGE_W - MARGIN * 2,
        align: "right",
      });

    // Thin accent line
    doc.rect(0, 110, PAGE_W, 3).fill(BLUE);

    // ── EMPLOYEE INFO BAND ───────────────────────────────────
    doc.rect(0, 113, PAGE_W, 72).fill(LGRAY);

    const infoY = 124;
    const fields = [
      ["Employee Name", `${employee.firstName} ${employee.lastName}`],
      ["Employee ID",   employee.employeeId],
      ["Department",    employee.department],
      ["Designation",   employee.designation],
    ];

    fields.forEach(([label, value], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = MARGIN + col * COL_W;
      const y = infoY + row * 28;

      doc.fontSize(8).font("Helvetica").fillColor(DGRAY).text(label.toUpperCase(), x, y);
      doc.fontSize(11).font("Helvetica-Bold").fillColor(BLACK).text(value || "—", x, y + 10);
    });

    // ── SECTION HELPER ────────────────────────────────────────
    let cursorY = 200;

    const sectionTitle = (title, color = BLUE) => {
      doc.rect(MARGIN, cursorY, PAGE_W - MARGIN * 2, 24).fill(color);
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(WHITE)
        .text(title, MARGIN + 10, cursorY + 7);
      cursorY += 24;
    };

    const tableRow = (left, right, shade = false) => {
      if (shade) doc.rect(MARGIN, cursorY, PAGE_W - MARGIN * 2, 22).fill(LGRAY);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(DGRAY)
        .text(left, MARGIN + 10, cursorY + 6);
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(BLACK)
        .text(right, MARGIN, cursorY + 6, { width: PAGE_W - MARGIN * 2 - 10, align: "right" });
      doc.rect(MARGIN, cursorY + 22, PAGE_W - MARGIN * 2, 0.5).fill(MGRAY);
      cursorY += 22;
    };

    const totalRow = (left, right, bgColor = NAVY, textColor = WHITE) => {
      doc.rect(MARGIN, cursorY, PAGE_W - MARGIN * 2, 26).fill(bgColor);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(textColor).text(left, MARGIN + 10, cursorY + 8);
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(textColor)
        .text(right, MARGIN, cursorY + 8, { width: PAGE_W - MARGIN * 2 - 10, align: "right" });
      cursorY += 26;
    };

    // ── ATTENDANCE SUMMARY ────────────────────────────────────
    sectionTitle("ATTENDANCE SUMMARY");

    const attFields = [
      ["Working Days",  payroll.workingDays],
      ["Present Days",  payroll.presentDays],
      ["Leave Days",    payroll.leaveDays],
      ["Absent Days",   payroll.absentDays],
      ["Overtime Hours",payroll.overtimeHours || 0],
    ];
    attFields.forEach(([l, v], i) => tableRow(l, String(v), i % 2 === 0));

    cursorY += 14;

    // ── EARNINGS ──────────────────────────────────────────────
    sectionTitle("EARNINGS");

    const earningRows = [
      ["Basic Salary",       fmt(salary.basicSalary)],
      ["House Rent Allowance (HRA)", fmt(salary.hra)],
      ["Special Allowance",  fmt(salary.specialAllowance)],
      ["Bonus",              fmt(salary.bonus)],
    ];
    earningRows.forEach(([l, v], i) => tableRow(l, v, i % 2 === 0));
    totalRow("Gross Salary", fmt(salary.grossSalary));

    cursorY += 14;

    // ── DEDUCTIONS ────────────────────────────────────────────
    sectionTitle("DEDUCTIONS", "#8B1A1A");

    const deductionRows = [
      ["Provident Fund (PF)",  fmt(salary.pf)],
      ["Professional Tax",     fmt(salary.professionalTax)],
      ["Other Deductions",     fmt(salary.otherDeductions)],
      ["Absent Deduction",     fmt(payroll.deductions)],
    ];
    deductionRows.forEach(([l, v], i) => tableRow(l, v, i % 2 === 0));
    totalRow(
      "Total Deductions",
      fmt(
        (salary.pf || 0) +
        (salary.professionalTax || 0) +
        (salary.otherDeductions || 0) +
        (payroll.deductions || 0)
      ),
      "#8B1A1A"
    );

    cursorY += 20;

    // ── NET SALARY BOX ────────────────────────────────────────
    doc.rect(MARGIN, cursorY, PAGE_W - MARGIN * 2, 56).fill(GBG);
    doc.rect(MARGIN, cursorY, 5, 56).fill(GREEN);

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor(GREEN)
      .text("NET SALARY PAYABLE", MARGIN + 18, cursorY + 10);

    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor(GREEN)
      .text(fmt(payroll.netSalary), MARGIN + 18, cursorY + 24);

    // Payment status badge (right side of net box)
    const statusLabel = payroll.paymentStatus || "Pending";
    const statusColor = statusLabel === "Paid" ? GREEN : "#B7791F";
    const statusBg    = statusLabel === "Paid" ? "#C6F6D5" : "#FEFCBF";

    doc.roundedRect(PAGE_W - MARGIN - 90, cursorY + 14, 86, 26, 4).fill(statusBg);
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(statusColor)
      .text(statusLabel.toUpperCase(), PAGE_W - MARGIN - 90, cursorY + 21, { width: 86, align: "center" });

    cursorY += 76;

    // ── FOOTER ────────────────────────────────────────────────
    doc.rect(0, PAGE_H - 48, PAGE_W, 48).fill(LGRAY);
    doc.rect(0, PAGE_H - 48, PAGE_W, 1).fill(MGRAY);

    const generatedDate = new Date(payroll.generatedAt).toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
    });

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(DGRAY)
      .text(
        `Generated on ${generatedDate}   •   This is a system-generated payslip and does not require a signature.`,
        MARGIN,
        PAGE_H - 30,
        { width: PAGE_W - MARGIN * 2, align: "center" }
      );

    doc.end();

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};