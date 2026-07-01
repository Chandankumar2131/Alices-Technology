const moment = require("moment-timezone");
const LeaveBalance = require("../model/LeaveBalance");
const { TZ } = require("./attendanceShift");

const CASUAL_LEAVE_PER_YEAR = 3;
const SICK_LEAVE_PER_MONTH = 1;
const SICK_ELIGIBILITY_MONTHS = 3;
const CASUAL_ELIGIBILITY_MONTHS = 6;
const CARRY_FORWARD_VALID_DAYS = 90;

const startOfDay = (date) => moment.tz(date, TZ).startOf("day");

const monthsCompleted = (joiningDate, asOf = new Date()) => {
  const joined = startOfDay(joiningDate);
  const today = startOfDay(asOf);
  if (!joiningDate || !joined.isValid() || today.isBefore(joined)) return 0;
  return today.diff(joined, "months");
};

const getCurrentYearEligibilityDate = (joiningDate, months) => {
  const eligibleAt = startOfDay(joiningDate).add(months, "months");
  return eligibleAt.isValid() ? eligibleAt : null;
};

const syncLeaveBalance = async (employee, asOf = new Date()) => {
  let balance = await LeaveBalance.findOne({ employee: employee._id });
  if (!balance) {
    balance = await LeaveBalance.create({ employee: employee._id });
  }

  const now = moment.tz(asOf, TZ);
  const joiningDate = employee.joiningDate || employee.createdAt;
  const completedMonths = monthsCompleted(joiningDate, asOf);

  if (
    balance.carryForwardExpiresAt &&
    now.isAfter(moment(balance.carryForwardExpiresAt))
  ) {
    balance.carryForwardAvailable = 0;
    balance.carryForwardExpiresAt = undefined;
  }

  if (completedMonths >= SICK_ELIGIBILITY_MONTHS) {
    const eligibleAt = getCurrentYearEligibilityDate(joiningDate, SICK_ELIGIBILITY_MONTHS);
    const currentMonthStart = now.clone().startOf("month");
    const firstAccrualMonth = moment.max(eligibleAt.clone().startOf("month"), startOfDay(joiningDate));
    let monthsToAccrue = 0;

    if (balance.lastSickAccrualKey) {
      const lastAccrued = moment.tz(`${balance.lastSickAccrualKey}-01`, "YYYY-MM-DD", TZ);
      monthsToAccrue = currentMonthStart.diff(lastAccrued, "months");
    } else if (!currentMonthStart.isBefore(firstAccrualMonth)) {
      monthsToAccrue = currentMonthStart.diff(firstAccrualMonth, "months") + 1;
    }

    if (monthsToAccrue > 0) {
      balance.sickAvailable += monthsToAccrue * SICK_LEAVE_PER_MONTH;
      balance.lastSickAccrualKey = currentMonthStart.format("YYYY-MM");
    }
  }

  if (completedMonths >= CASUAL_ELIGIBILITY_MONTHS) {
    const year = now.year();
    if (balance.lastCasualAccrualYear !== year) {
      if (balance.lastCasualAccrualYear && balance.casualAvailable > 0) {
        balance.carryForwardAvailable += balance.casualAvailable;
        balance.carryForwardExpiresAt = moment
          .tz(`${year}-01-01`, "YYYY-MM-DD", TZ)
          .add(CARRY_FORWARD_VALID_DAYS, "days")
          .toDate();
      }
      balance.casualAvailable = CASUAL_LEAVE_PER_YEAR;
      balance.lastCasualAccrualYear = year;
    }
  }

  balance.lastSyncedAt = asOf;
  await balance.save();
  return balance;
};

const consumeLeaveBalance = async (balance, leaveType, totalDays) => {
  let remaining = Number(totalDays || 0);
  let paidDays = 0;

  const consume = (field) => {
    const used = Math.min(balance[field] || 0, remaining);
    balance[field] = Number(((balance[field] || 0) - used).toFixed(2));
    remaining = Number((remaining - used).toFixed(2));
    paidDays = Number((paidDays + used).toFixed(2));
  };

  if (leaveType === "Casual Leave") {
    consume("carryForwardAvailable");
    consume("casualAvailable");
  } else if (leaveType === "Sick Leave" || leaveType === "Emergency Leave") {
    consume("sickAvailable");
  } else if (leaveType === "Paid Leave") {
    consume("carryForwardAvailable");
    consume("casualAvailable");
    consume("sickAvailable");
  }

  const unpaidDays = Math.max(remaining, 0);
  balance.unpaidLeaveDays = Number(((balance.unpaidLeaveDays || 0) + unpaidDays).toFixed(2));
  await balance.save();

  return { paidDays, unpaidDays };
};

module.exports = {
  syncLeaveBalance,
  consumeLeaveBalance,
  monthsCompleted,
  SICK_ELIGIBILITY_MONTHS,
  CASUAL_ELIGIBILITY_MONTHS,
};
