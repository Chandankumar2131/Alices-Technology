const Attendance = require("../model/Attendance");
const BreakLog = require("../model/BreakLog");
const moment = require("moment-timezone");
const { TZ, AUTO_CHECKOUT_TIME, getShiftBoundary } = require("./attendanceShift");

const calculateAttendanceTotals = (attendance) => {
  const totalHours =
    (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);

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
};

const closeOpenAttendance = async (attendance, checkoutMoment) => {
  const checkoutDate = checkoutMoment.toDate();

  const activeBreaks = await BreakLog.find({
    employee: attendance.employee,
    attendance: attendance._id,
    status: "Active",
  });

  for (const activeBreak of activeBreaks) {
    activeBreak.breakEnd = checkoutDate;
    activeBreak.duration = Number(
      ((activeBreak.breakEnd - activeBreak.breakStart) / (1000 * 60)).toFixed(2)
    );
    activeBreak.status = "Completed";
    await activeBreak.save();

    attendance.breakHours = Number(
      (attendance.breakHours + activeBreak.duration / 60).toFixed(2)
    );
  }

  attendance.checkOut = checkoutDate;
  attendance.earlyLogout = false;
  attendance.remarks = attendance.remarks
    ? `${attendance.remarks} | Auto checked out at 05:00 AM`
    : "Auto checked out at 05:00 AM";

  calculateAttendanceTotals(attendance);
  await attendance.save();
};

const autoCheckoutOpenAttendances = async (now = moment().tz(TZ)) => {
  const nowMoment = moment(now).tz(TZ);
  const openAttendances = await Attendance.find({
    checkIn: { $ne: null },
    checkOut: null,
    status: { $in: ["Present", "Half Day"] },
  });

  let checkedOutCount = 0;

  for (const attendance of openAttendances) {
    const autoCheckoutMoment = getShiftBoundary(
      attendance.attendanceDate,
      AUTO_CHECKOUT_TIME
    ).add(1, "day");

    if (nowMoment.isBefore(autoCheckoutMoment)) {
      continue;
    }

    await closeOpenAttendance(attendance, autoCheckoutMoment);
    checkedOutCount++;
  }

  return checkedOutCount;
};

const startAutoCheckoutJob = () => {
  autoCheckoutOpenAttendances().catch((error) => {
    console.error("Auto checkout failed", error);
  });

  return setInterval(() => {
    autoCheckoutOpenAttendances().catch((error) => {
      console.error("Auto checkout failed", error);
    });
  }, 5 * 60 * 1000);
};

module.exports = {
  autoCheckoutOpenAttendances,
  calculateAttendanceTotals,
  startAutoCheckoutJob,
};
