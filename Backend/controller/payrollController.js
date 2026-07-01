const Payroll = require("../model/Payroll");
const Attendance = require("../model/Attendance");
const SalaryStructure = require("../model/SalaryStructure");
const PDFDocument = require("pdfkit");
const User = require("../model/User");
const Holiday = require("../model/Holiday");
const Leave = require("../model/Leave");
const path = require("path")
const moment = require("moment-timezone");
const { TZ } = require("../utils/attendanceShift");
const { getPagination, paginatedResponse } = require("../utils/pagination");

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

    const monthStart = moment.tz(
      `${year}-${String(month).padStart(2, "0")}-01`,
      "YYYY-MM-DD",
      TZ
    );
    const monthEnd = monthStart.clone().endOf("month");

    const attendance =
      await Attendance.find({
        employee: employeeId,
        attendanceDate: {
          $gte: monthStart.format("YYYY-MM-DD"),
          $lte: monthEnd.format("YYYY-MM-DD"),
        },
      });

    const holidays = await Holiday.find({
      date: {
        $gte: monthStart.format("YYYY-MM-DD"),
        $lte: monthEnd.format("YYYY-MM-DD"),
      },
    });
    const holidayDates = new Set(holidays.map((holiday) => holiday.date));
    const attendanceDates = new Set(
      attendance.map((record) => record.attendanceDate)
    );

    let presentDays = 0;
    let halfDays = 0;
    let leaveDays = 0;
    let holidayDays = 0;
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
          "Half Day"
        ) {
          halfDays++;
        }

        if (
          record.status ===
          "Leave"
        ) {
          leaveDays++;
        }

        if (
          record.status ===
          "Holiday"
        ) {
          holidayDays++;
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
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

      if (
        day !== 0 &&
        day !== 6
      ) {
        workingDays++;
        if (holidayDates.has(dateKey) && !attendanceDates.has(dateKey)) {
          holidayDays++;
        }
      }
    }

    absentDays =
      workingDays -
      presentDays -
      halfDays -
      leaveDays -
      holidayDays;

    if (absentDays < 0) {
      absentDays = 0;
    }

    const perDaySalary =
      salaryStructure.netSalary /
      workingDays;

    const approvedLeaves = await Leave.find({
      employee: employeeId,
      status: "Approved",
      startDate: {
        $lte: monthEnd.toDate(),
      },
      endDate: {
        $gte: monthStart.toDate(),
      },
    });

    const unpaidLeaveDays = approvedLeaves.reduce(
      (sum, leave) => sum + (leave.unpaidDays || 0),
      0
    );

    const paidDays =
      presentDays +
      leaveDays +
      holidayDays +
      halfDays * 0.5;

    const unpaidDays =
      workingDays -
      paidDays;

    const absentDeduction =
      perDaySalary *
      unpaidDays;

    const unpaidLeaveDeduction =
      perDaySalary *
      unpaidLeaveDays;

    const finalSalary =
      salaryStructure.netSalary -
      absentDeduction -
      unpaidLeaveDeduction;

    const payroll =
      await Payroll.create({
        employee: employeeId,

        salaryStructure:
          salaryStructure._id,

        month,

        year,

        workingDays,

        presentDays,

        halfDays,

        leaveDays,

        holidayDays,

        absentDays,

        unpaidLeaveDays,

        overtimeHours,

        grossSalary:
          salaryStructure.grossSalary,

        deductions:
          absentDeduction + unpaidLeaveDeduction,

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
      const { page, limit, skip } = getPagination(req.query);
      const filter = {
        employee:
          req.user.id,
      };

      const payroll =
        await Payroll.find(filter)
          .populate(
            "salaryStructure"
          )
          .sort({
            year: -1,
            month: -1,
          })
          .skip(skip)
          .limit(limit);

      const total = await Payroll.countDocuments(filter);

      return res.status(200).json({
        success: true,
        ...paginatedResponse({ page, limit, total, data: payroll }),
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
      const { page, limit, skip } = getPagination(req.query);
      const filter = {
        employee:
          employeeId,
      };

      const payroll =
        await Payroll.find(filter)
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
          })
          .skip(skip)
          .limit(limit);

      const total = await Payroll.countDocuments(filter);

      return res.status(200).json({
        success: true,
        ...paginatedResponse({ page, limit, total, data: payroll }),
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
      const { page, limit, skip } = getPagination(req.query);

      const payrolls =
        await Payroll.find()
          .populate(
            "employee",
            "firstName lastName email employeeId department designation"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit);

      const total = await Payroll.countDocuments();

      return res.status(200).json({
        success: true,
        ...paginatedResponse({ page, limit, total, data: payrolls }),
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
      .populate(
        "employee",
        "firstName lastName email employeeId department designation"
      )
      .populate("salaryStructure");

    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll not found" });
    }

    // ACCESS CONTROL
    const loggedInUserId = req.user.id;
    const accountType = req.user.accountType;
    if (accountType === "Employee" && payroll.employee._id.toString() !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this payslip",
      });
    }

    const employee = payroll.employee;
    const salary = payroll.salaryStructure;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const monthLabel = monthNames[payroll.month - 1] || payroll.month;

    const doc = new PDFDocument({ margin: 0, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payslip-${payroll.month}-${payroll.year}.pdf`
    );
    doc.pipe(res);

    // ── Geometry ──────────────────────────────────────────────
    const PAGE_W = 595;
    const PAGE_H = 842;
    const MARGIN = 40;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const GAP = 16;
    const COL_W = (CONTENT_W - GAP) / 2;
    const leftX = MARGIN;
    const rightX = MARGIN + COL_W + GAP;

    // ── Colours ──────────────────────────────────────────────
    const NAVY = "#0C3B6E";
    const BLUE = "#1A6DB5";
    const LGRAY = "#F4F6FA";
    const MGRAY = "#D1D9E6";
    const DGRAY = "#4A5568";
    const BLACK = "#1A202C";
    const WHITE = "#FFFFFF";
    const GREEN = "#276749";
    const ACCENT = "#1A6DB5";
    const SOFT = "#6B7280";
    const LINE = "#E5E8EF";

    const fmt = (n) =>
      "Rs. " +
      Number(n || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    // ============================================================
    // HEADER: logo left + company name beside it
    // ============================================================
    doc.rect(0, 0, PAGE_W, 100).fill(NAVY);

    let nameX = MARGIN;
    try {
      const logoPath = path.join(__dirname, "../assets/1ch.png"); // adjust if needed
      doc.image(logoPath, MARGIN, 26, { fit: [48, 48] });
      nameX = MARGIN + 60;
    } catch (e) {
      nameX = MARGIN;
    }

    doc
      .fillColor(WHITE)
      .fontSize(19)
      .font("Helvetica-Bold")
      .text("ALICE TECH SOLUTIONS", nameX, 30);

    doc
      .fillColor("#A8C4E0")
      .fontSize(8.5)
      .font("Helvetica")
      .text("Siddhivinayak tower, Makarba, Ahmedabad, India  •  info@alicestechsolutions.com", nameX, 54);

    // Payslip title (right)
    doc
      .fillColor(WHITE)
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("PAYSLIP", MARGIN, 30, { width: CONTENT_W, align: "right" });
    doc
      .fillColor("#A8C4E0")
      .fontSize(9)
      .font("Helvetica")
      .text(`${monthLabel.toUpperCase()} ${payroll.year}`, MARGIN, 50, {
        width: CONTENT_W,
        align: "right",
      });

    doc.rect(0, 100, PAGE_W, 3).fill(BLUE);

    // ============================================================
    // EMPLOYEE INFO STRIP
    // ============================================================
    let y = 103;
    doc.rect(0, y, PAGE_W, 80).fill(LGRAY);

    const payDate = payroll.paidAt
      ? new Date(payroll.paidAt)
      : new Date(payroll.generatedAt);

    const infoFields = [
      ["Employee Name", `${employee.firstName} ${employee.lastName}`],
      ["Employee ID", employee.employeeId || "—"],
      ["Department", employee.department || "—"],
      ["Designation", employee.designation || "—"],
      ["Pay Period", `${monthLabel} ${payroll.year}`],
      ["Pay Date", payDate.toLocaleDateString("en-US", {
        day: "2-digit", month: "short", year: "numeric", timeZone: TZ,
      })],
    ];

    const infoColW = CONTENT_W / 3;
    infoFields.forEach(([label, value], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = MARGIN + col * infoColW;
      const fy = y + 16 + row * 34;
      doc.fontSize(7.5).font("Helvetica").fillColor(DGRAY).text(label.toUpperCase(), x, fy);
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(BLACK).text(String(value), x, fy + 11, {
        width: infoColW - 6,
      });
    });

    // ============================================================
    // BODY (Zoho/Amazon-style)
    // ============================================================
    const totalDeductions =
      (salary.pf || 0) +
      (salary.professionalTax || 0) +
      (salary.otherDeductions || 0) +
      (payroll.deductions || 0);

    // ── NET PAY HERO ──────────────────────────────────────────
    let y2 = 205;
    doc.roundedRect(MARGIN, y2, CONTENT_W, 78, 8).fill("#F0F7FF");
    doc.roundedRect(MARGIN, y2, 6, 78, 8).fill(ACCENT);

    doc.fillColor(SOFT).fontSize(9).font("Helvetica")
      .text("EMPLOYEE NET PAY", MARGIN + 22, y2 + 16);
    doc.fillColor(NAVY).fontSize(28).font("Helvetica-Bold")
      .text(fmt(payroll.netSalary), MARGIN + 22, y2 + 30);

    doc.fillColor(SOFT).fontSize(9).font("Helvetica")
      .text("Pay Period", MARGIN, y2 + 16, { width: CONTENT_W - 22, align: "right" });
    doc.fillColor(BLACK).fontSize(11).font("Helvetica-Bold")
      .text(`${monthLabel} ${payroll.year}`, MARGIN, y2 + 29, { width: CONTENT_W - 22, align: "right" });

    const statusLabel = payroll.paymentStatus || "Pending";
    const statusColor = statusLabel === "Paid" ? GREEN : "#B7791F";
    const statusBg = statusLabel === "Paid" ? "#D8F3E3" : "#FEF3C7";
    doc.roundedRect(PAGE_W - MARGIN - 70, y2 + 48, 70, 18, 9).fill(statusBg);
    doc.fillColor(statusColor).fontSize(8.5).font("Helvetica-Bold")
      .text(statusLabel.toUpperCase(), PAGE_W - MARGIN - 70, y2 + 52, { width: 70, align: "center" });

    // ── SALARY DETAILS TABLE ──────────────────────────────────
    let ty = y2 + 104;

    doc.fillColor(BLACK).fontSize(11).font("Helvetica-Bold")
      .text("Salary Details", MARGIN, ty);
    ty += 22;

    const colL = MARGIN;
    const colR = rightX;

    doc.fillColor(SOFT).fontSize(8.5).font("Helvetica-Bold");
    doc.text("EARNINGS", colL, ty);
    doc.text("AMOUNT", colL, ty, { width: COL_W, align: "right" });
    doc.text("DEDUCTIONS", colR, ty);
    doc.text("AMOUNT", colR, ty, { width: COL_W, align: "right" });
    ty += 14;
    doc.rect(MARGIN, ty, CONTENT_W, 1).fill(LINE);
    ty += 8;

    const earnings = [
      ["Basic Salary", salary.basicSalary],
      ["House Rent Allowance", salary.hra],
      ["Special Allowance", salary.specialAllowance],
      ["Bonus", salary.bonus],
    ];
    const deductions = [
      ["Provident Fund", salary.pf],
      ["Professional Tax", salary.professionalTax],
      ["Other Deductions", salary.otherDeductions],
      ["Absent Deduction", payroll.deductions],
    ];

    const rowH = 22;
    const rowsCount = Math.max(earnings.length, deductions.length);

    for (let i = 0; i < rowsCount; i++) {
      const rowY = ty + i * rowH;

      if (earnings[i]) {
        doc.fillColor(DGRAY).fontSize(9.5).font("Helvetica")
          .text(earnings[i][0], colL, rowY);
        doc.fillColor(BLACK).fontSize(9.5).font("Helvetica")
          .text(fmt(earnings[i][1]), colL, rowY, { width: COL_W, align: "right" });
      }
      if (deductions[i]) {
        doc.fillColor(DGRAY).fontSize(9.5).font("Helvetica")
          .text(deductions[i][0], colR, rowY);
        doc.fillColor(BLACK).fontSize(9.5).font("Helvetica")
          .text(fmt(deductions[i][1]), colR, rowY, { width: COL_W, align: "right" });
      }
      doc.rect(MARGIN, rowY + rowH - 6, CONTENT_W, 0.5).fill(LINE);
    }

    // Vertical divider between columns
    doc.rect(MARGIN + COL_W + GAP / 2, ty - 22, 0.5, rowsCount * rowH + 26).fill(LINE);

    // Totals row
    let totY = ty + rowsCount * rowH + 4;
    doc.rect(MARGIN, totY, CONTENT_W, 26).fill("#F7F9FC");

    doc.fillColor(BLACK).fontSize(9.5).font("Helvetica-Bold")
      .text("Gross Earnings", colL + 4, totY + 8);
    doc.text(fmt(salary.grossSalary), colL, totY + 8, { width: COL_W - 4, align: "right" });

    doc.text("Total Deductions", colR + 4, totY + 8);
    doc.text(fmt(totalDeductions), colR, totY + 8, { width: COL_W - 4, align: "right" });

    // ── ATTENDANCE ────────────────────────────────────────────
    let ay = totY + 48;
    doc.fillColor(BLACK).fontSize(11).font("Helvetica-Bold").text("Attendance", MARGIN, ay);
    ay += 20;

    const stats = [
      ["Working Days", payroll.workingDays],
      ["Present", payroll.presentDays],
      ["Half Day", payroll.halfDays || 0],
      ["Leave", payroll.leaveDays],
      ["Holiday", payroll.holidayDays || 0],
      ["Absent", payroll.absentDays],
      ["Overtime", `${payroll.overtimeHours || 0}h`],
    ];
    const sW = CONTENT_W / stats.length;
    doc.roundedRect(MARGIN, ay - 8, CONTENT_W, 48, 8).strokeColor(LINE).lineWidth(1).stroke();
    stats.forEach(([label, value], i) => {
      const x = MARGIN + i * sW;
      doc.fillColor(NAVY).fontSize(15).font("Helvetica-Bold")
        .text(String(value), x, ay, { width: sW, align: "center" });
      doc.fillColor(SOFT).fontSize(7.5).font("Helvetica")
        .text(label.toUpperCase(), x, ay + 19, { width: sW, align: "center" });
    });

    // ============================================================
    // FOOTER
    // ============================================================
    doc.rect(0, PAGE_H - 44, PAGE_W, 44).fill(LGRAY);
    doc.rect(0, PAGE_H - 44, PAGE_W, 1).fill(MGRAY);

    const generatedDate = new Date(payroll.generatedAt).toLocaleDateString("en-US", {
      day: "2-digit", month: "long", year: "numeric", timeZone: TZ,
    });
    doc.fillColor(DGRAY).fontSize(8).font("Helvetica").text(
      `Generated on ${generatedDate}   •   This is a system-generated payslip and does not require a signature.`,
      MARGIN,
      PAGE_H - 28,
      { width: CONTENT_W, align: "center" }
    );

    doc.end();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
