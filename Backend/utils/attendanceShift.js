const moment = require("moment-timezone");

const TZ = process.env.ATTENDANCE_TZ || "Asia/Kolkata";
const CHECK_IN_START = { hour: 19, minute: 0 };
const CHECK_IN_END = { hour: 19, minute: 10 };
const FULL_DAY_CHECK_IN_LIMIT = { hour: 20, minute: 0 };
const CHECK_OUT_TIME = { hour: 4, minute: 0 };
const AUTO_CHECKOUT_TIME = { hour: 5, minute: 0 };
const SHIFT_DATE_CUTOFF = AUTO_CHECKOUT_TIME;
const HALF_DAY_MIN_HOURS = 4;
const FULL_DAY_MIN_HOURS = 7 + 50 / 60;

const getShiftDate = (time = moment().tz(TZ)) => {
  const localTime = moment(time).tz(TZ);
  const cutoff = localTime.clone().hour(SHIFT_DATE_CUTOFF.hour).minute(SHIFT_DATE_CUTOFF.minute).second(0).millisecond(0);

  return localTime.isBefore(cutoff)
    ? localTime.clone().subtract(1, "day").format("YYYY-MM-DD")
    : localTime.format("YYYY-MM-DD");
};

const getShiftBoundary = (shiftDate, boundary) =>
  moment.tz(
    `${shiftDate} ${String(boundary.hour).padStart(2, "0")}:${String(
      boundary.minute
    ).padStart(2, "0")}`,
    "YYYY-MM-DD HH:mm",
    TZ
  );

module.exports = {
  TZ,
  CHECK_IN_START,
  CHECK_IN_END,
  FULL_DAY_CHECK_IN_LIMIT,
  CHECK_OUT_TIME,
  AUTO_CHECKOUT_TIME,
  SHIFT_DATE_CUTOFF,
  HALF_DAY_MIN_HOURS,
  FULL_DAY_MIN_HOURS,
  getShiftDate,
  getShiftBoundary,
};
